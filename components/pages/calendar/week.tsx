import { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { dayNames, getEventColorClass } from "./utils";
import { type CalendarEvent } from "@/lib/services/calendar-service";
import { toYmd } from "@/lib/utils";
import { router } from "expo-router";

type WeekViewProps = {
    currentDate: Date;
    events: Record<string, CalendarEvent[]>;
};

export const WeekView = ({ currentDate, events }: WeekViewProps) => {
    const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        setWeekEvents(events[toYmd(currentDate)] || []);
    }, [events, currentDate]);

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

    // Layout constants and helpers
    const GRID_ROW_HEIGHT = 40; // 30 minutes
    const HOUR_HEIGHT = GRID_ROW_HEIGHT * 2;
    const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
    const TIME_COL_WIDTH = 56; // w-14
    const dayContentHeight = useMemo(() => timeSlots.length * GRID_ROW_HEIGHT, [timeSlots.length]);

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    const parsedEvents = useMemo(() => {
        const parseDateTime = (s: string) => new Date((s || "").replace(" ", "T"));
        return (weekEvents || []).map((e) => ({
            ...e,
            startDate: parseDateTime(e.start_date),
            endDate: parseDateTime(e.end_date),
            allDay: !!e.allday,
        }));
    }, [weekEvents]);

    const handleEventClick = (source: string, source_id: string) => {
        if (source === 'block_time') {
            router.push({
                pathname: '/artist/calendar/event-block-time/[id]',
                params: { id: source_id }
            });
        } 
        else if (source === 'spot_convention') {
            router.push({
                pathname: '/artist/calendar/spot-convention/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'temp_change') {
            router.push({
                pathname: '/artist/calendar/temp-change/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'book_off') {
            router.push({
                pathname: '/artist/calendar/off-days/[id]',
                params: { id: source_id }
            });
        }
    }

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
                            const items = (events[key] || []).filter(ev => ev.type === "background" || ev.allday === true);
                            if (items.length === 0) return null;
                            return items.map(ev => (
                                <Pressable
                                    key={ev.id}
                                    className={`px-2 absolute top-0 bottom-0 h-full items-center ${getEventColorClass(ev.color)}`}
                                    style={{ opacity: 0.8, left: 0, right: -1 }}
                                    onPress={() => handleEventClick(ev.source, ev.source_id)}
                                >
                                </Pressable>
                            ));
                        })()}
                    </View>
                ))}
            </View>

            {/* Time grid */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View style={{ height: dayContentHeight, position: "relative" }}>
                    {timeSlots.map((slot, rowIdx) => (
                        <View key={rowIdx} className="flex-row border-b border-border-secondary" style={{ height: GRID_ROW_HEIGHT }}>
                            <View className="w-14 justify-center items-center border-r border-border-secondary py-2">
                                <Text className="text-xs">{slot.timeString}</Text>
                                <Text className="text-xs leading-none">{slot.amPm}</Text>
                            </View>
                            {weekDays.map((d, colIdx) => (
                                <View
                                    key={colIdx}
                                    className="flex-1 justify-center items-center py-2 border-r border-border-secondary"
                                    style={colIdx === 6 ? { borderRightWidth: 0 } : {}}
                                />
                            ))}
                        </View>
                    ))}

                    {/* Timed overlays across the week */}
                    <View
                        style={{
                            position: "absolute",
                            left: TIME_COL_WIDTH,
                            right: 0,
                            top: 0,
                            bottom: 0,
                        }}
                    >
                        <View style={{ flex: 1, flexDirection: "row" }}>
                            {weekDays.map((wd, di) => {
                                const dStart = startOfDay(wd.date).getTime();
                                const dEnd = endOfDay(wd.date).getTime();
                                const dayTimed = parsedEvents.filter(
                                    (e: any) => !e.allDay && e.type === "item" && e.endDate.getTime() >= dStart && e.startDate.getTime() <= dEnd
                                );
                                return (
                                    <View key={`wkcol-${di}`} style={{ flex: 1, position: "relative" }}>
                                        {dayTimed.map((e: any, idx: number) => {
                                            const s = Math.max(e.startDate.getTime(), dStart);
                                            const en = Math.min(e.endDate.getTime(), dEnd);
                                            const minutesFromStart = (s - dStart) / (1000 * 60);
                                            const minutesDuration = Math.max(15, (en - s) / (1000 * 60));
                                            return (
                                                <Pressable
                                                    key={`wkitem-${di}-${idx}`}
                                                    style={{
                                                        position: "absolute",
                                                        top: minutesFromStart * MINUTE_HEIGHT,
                                                        left: 4,
                                                        right: 4,
                                                        height: minutesDuration * MINUTE_HEIGHT,
                                                        borderRadius: 6,
                                                        paddingHorizontal: 4,
                                                        justifyContent: "center",
                                                    }}
                                                    className={`${getEventColorClass(e.color)}`}
                                                    onPress={() => handleEventClick(e.source, e.source_id)}
                                                >
                                                    <Text className="text-[10px] text-foreground text-center" numberOfLines={2}>
                                                        {e.title || "Event"}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};