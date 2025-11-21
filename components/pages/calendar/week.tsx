import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { dayNames, toLocalDateString, getEventColorClass } from "./utils";
import { useAuth } from "@/lib/contexts/auth-context";
import { getEventsInRange, type CalendarEvent } from "@/lib/services/calendar-service";
import { useFocusEffect } from "@react-navigation/native";
import { toYmd, parseYmdFromDb } from "@/lib/utils";

type WeekViewProps = {
    currentDate: Date;
    onTimeSelect: (datetime: string) => void;
};

export const WeekView = ({ currentDate, onTimeSelect }: WeekViewProps) => {
    const { artist } = useAuth();
    const [eventsByDay, setEventsByDay] = useState<Record<string, CalendarEvent[]>>({});

    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay(); // 0 = Sun
        const diff = startOfWeek.getDate() - day; // back to Sunday
        startOfWeek.setDate(diff);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            return {
                date,
                name: dayNames[i],
                number: date.getDate(),
            };
        });
    }, [currentDate]);

    const weekRange = useMemo(() => {
        const start = new Date(weekDays[0].date.getFullYear(), weekDays[0].date.getMonth(), weekDays[0].date.getDate(), 0, 0, 0, 0);
        const last = weekDays[weekDays.length - 1].date;
        const end = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999);
        return { start, end };
    }, [weekDays]);

    const loadEvents = useCallback(async () => {
        if (!artist?.id || weekDays.length === 0) return;
        try {
            const res = await getEventsInRange({
                artistId: artist.id,
                start: weekRange.start,
                end: weekRange.end,
            });
            const events = res.events || [];

            const visibleStart = new Date(weekDays[0].date.getFullYear(), weekDays[0].date.getMonth(), weekDays[0].date.getDate(), 12);
            const last = weekDays[weekDays.length - 1].date;
            const visibleEnd = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 12);

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
        } catch {
            setEventsByDay({});
        }
    }, [artist?.id, weekDays, weekRange.start, weekRange.end]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    useFocusEffect(
        useCallback(() => {
            loadEvents();
        }, [loadEvents])
    );

    const timeSlots = useMemo(() => {
        // 30-minute slots (48 rows), matching DayView formatting
        const slots: { hour: number; minute: number; timeString: string, amPm: string }[] = [];
        for (let i = 0; i < 48; i++) {
            const hour24 = Math.floor(i / 2);
            const minute = i % 2 === 0 ? 0 : 30;

            let displayHour = hour24 % 12;
            if (displayHour === 0) displayHour = 12;
            const suffix = hour24 < 12 ? "am" : "pm";
            const minuteStr = minute.toString().padStart(2, "0");

            const timeString = `${displayHour}:${minuteStr}`;
            slots.push({ hour: hour24, minute, timeString, amPm: suffix });
        }
        return slots;
    }, [currentDate]);

    return (
        <View className="flex-1 border border-border-secondary">
            {/* Header */}
            <View className="flex-row border-b border-border-secondary">
                <View className="w-14 h-10 justify-center items-center border-r border-border-secondary">
                    <Text className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                        Time
                    </Text>
                </View>
                {weekDays.map((d, idx) => (
                    <View
                        key={idx}
                        className="flex-1 h-10 justify-center items-center border-r border-border-secondary"
                        style={idx === 6 ? { borderRightWidth: 0 } : {}}
                    >
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                            {d.name}
                        </Text>
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                            {d.number}
                        </Text>
                    </View>
                ))}
            </View>

            {/* All-day band */}
            <View className="flex-row items-center border-b border-border-secondary" style={{ height: 28 }}>
                <View className="w-14 h-full justify-center items-center border-r border-border-secondary">
                    <Text className="text-[10px] text-text-secondary" style={{ letterSpacing: 1 }}>
                        All-day
                    </Text>
                </View>
                {weekDays.map((wd, idx) => (
                    <View key={`ad-${idx}`} className="flex-1 h-full flex-row flex-wrap items-center border-r border-border-secondary" style={idx === 6 ? { borderRightWidth: 0 } : {}}>
                        {(() => {
                            const key = toYmd(wd.date);
                            const items = (eventsByDay[key] || []).filter(ev => ev.type === "background" || ev.allday === true);
                            if (items.length === 0) return null;
                            return items.map(ev => (
                                <Pressable
                                    key={ev.id}
                                    className={`px-2 absolute top-0 bottom-0 h-full items-center ${getEventColorClass(ev.color)}`}
                                    style={{ opacity: 0.8, left: 0, right: -1 }}
                                    pointerEvents="none"
                                >
                                </Pressable>
                            ));
                        })()}
                    </View>
                ))}
            </View>

            {/* Time grid */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {timeSlots.map((slot, rowIdx) => (
                    <View key={rowIdx} className="flex-row border-b border-border-secondary" style={{ height: 40 }}>
                        <View className="w-14 justify-center items-center border-r border-border-secondary py-2">
                            <Text className="text-xs">{slot.timeString}</Text>
                            <Text className="text-xs leading-none">{slot.amPm}</Text>
                        </View>
                        {weekDays.map((d, colIdx) => (
                            <Pressable
                                key={colIdx}
                                className="flex-1 justify-center items-center py-2 border-r border-border-secondary"
                                style={colIdx === 6 ? { borderRightWidth: 0 } : {}}
                                onPress={() => {
                                    const selectedDateTime = new Date(
                                        d.date.getFullYear(),
                                        d.date.getMonth(),
                                        d.date.getDate(),
                                        slot.hour,
                                        slot.minute,
                                        0,
                                        0
                                    );
                                    const datePart = toLocalDateString(selectedDateTime);
                                    const hh = String(selectedDateTime.getHours()).padStart(2, "0");
                                    const mm = String(selectedDateTime.getMinutes()).padStart(2, "0");
                                    const datetimeString = `${datePart} ${hh}:${mm}`;
                                    onTimeSelect(datetimeString);
                                }}
                            />
                        ))}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};