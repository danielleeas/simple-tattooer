import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View, ViewStyle } from "react-native";
import { Text } from "@/components/ui/text";
import { CalendarDay, dayNames, toLocalDateString, getEventColorClass } from "./utils";
import { toYmd, parseYmdFromDb } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/auth-context";
import { getEventsInRange, type CalendarEvent } from "@/lib/services/calendar-service";
import { useFocusEffect } from "@react-navigation/native";

type MonthViewProps = {
    currentDate: Date;
    onDatePress: (dateString: string) => void;
};

export const MonthView = ({ currentDate, onDatePress }: MonthViewProps) => {
    const { artist } = useAuth();
    const [eventsByDay, setEventsByDay] = useState<Record<string, CalendarEvent[]>>({});

    const isSameDay = (a: Date, b: Date) =>
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear();

    const calendarDays: CalendarDay[] = useMemo(() => {
        const today = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstOfMonth = new Date(year, month, 1);
        const startDate = new Date(firstOfMonth);
        startDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay()); // start on Sunday

        const days: CalendarDay[] = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const inMonth = date.getMonth() === month;
            days.push({
                date,
                isCurrentMonth: inMonth,
                isToday: isSameDay(date, today),
            });
        }
        return days;
    }, [currentDate]);

    const getMonthGridRange = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        const start = new Date(firstDay);
        start.setDate(start.getDate() - firstDayOfWeek);
        const end = new Date(start);
        end.setDate(end.getDate() + 41); // 6*7 - 1
        return { start, end };
    }, [currentDate]);

    const loadEvents = useCallback(async () => {
        if (!artist?.id) return;
        try {
            const { start, end } = getMonthGridRange;
            const res = await getEventsInRange({
                artistId: artist.id,
                start: start,
                end: end,
            });
            const events = res.events || [];

            const visibleStart = new Date(calendarDays[0].date.getFullYear(), calendarDays[0].date.getMonth(), calendarDays[0].date.getDate(), 12);
            const last = calendarDays[calendarDays.length - 1].date;
            const visibleEnd = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 12);

            // Map DB rows to Calendar's expected shape
            const map: Record<string, CalendarEvent[]> = {};
            for (const ev of events) {
                const evStart = parseYmdFromDb(ev.start_date);
                const evEnd = parseYmdFromDb(ev.end_date);

                const rangeStart = evStart < visibleStart ? visibleStart : evStart;
                const rangeEnd = evEnd > visibleEnd ? visibleEnd : evEnd;
                const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate(), 12);
                while (cursor <= rangeEnd) {
                    const key = toYmd(cursor);
                    if (!map[key]) map[key] = [];
                    map[key].push(ev);
                    cursor.setDate(cursor.getDate() + 1);
                }
            }
            setEventsByDay(map);
        } catch (e) {
            setEventsByDay({});
        }
    }, [artist?.id, getMonthGridRange]);

    // Fetch events for the visible 6x7 grid range
    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    useFocusEffect(
        useCallback(() => {
            loadEvents();
        }, [loadEvents])
    );

    return (
        <View className="flex-1 gap-0">
            <View className="flex-row border border-border-secondary">
                {dayNames.map((name, idx) => (
                    <View
                        key={name}
                        className="flex-1 h-10 justify-center items-center py-2 border-r border-border-secondary"
                        style={idx === 6 ? { borderRightWidth: 0 } : {}}
                    >
                        <Text variant="p" className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                            {name}
                        </Text>
                    </View>
                ))}
            </View>

            <View className="flex-1">
                {Array.from({ length: 6 }, (_, weekIndex) => (
                    <View
                        key={weekIndex}
                        className="flex-row flex-1 border-border-secondary"
                        style={{ borderLeftWidth: 1 }}
                    >
                        {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                            const showToday = day.isToday;
                            const bubbleClasses = showToday ? "border border-primary" : "";

                            return (
                                <Pressable
                                    key={`${weekIndex}-${dayIndex}`}
                                    onPress={() => onDatePress(toLocalDateString(day.date))}
                                    className="flex-1 items-center pt-2 justify-start border-border-secondary border-r border-b relative"
                                >
                                    <View className={`rounded-full relative items-center justify-center ${bubbleClasses}`} style={{ width: 24, height: 24 }}>
                                        <Text
                                            className={`text-xs ${showToday ? 'text-primary' : 'text-foreground'}`}
                                            style={!day.isCurrentMonth ? { opacity: 0.5 } : {}}
                                        >
                                            {day.date.getDate()}
                                        </Text>
                                    </View>

                                    {/* Background day shading */}
                                    {(() => {
                                        const key = toYmd(day.date);
                                        const bgs = (eventsByDay[key] || []).filter(ev => ev.type === 'background');
                                        if (bgs.length === 0) return null;
                                        return bgs.map((bg, i4) => {
                                            const style: Partial<ViewStyle> = {
                                                height: "25%",
                                                top: 32,
                                                right: -1,
                                                left: 0
                                            };
                                            return (
                                                <View
                                                    key={`mo-bg-${weekIndex}-${dayIndex}-${i4}`}
                                                    pointerEvents="none"
                                                    style={{ opacity: 0.5, ...style as ViewStyle }}
                                                    className={`absolute ${getEventColorClass(bg.color)}`}
                                                />
                                            );
                                        });
                                    })()}
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
};