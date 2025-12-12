import { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { dayNames, getEventColorClass } from "./utils";
import { useAuth } from "@/lib/contexts/auth-context";
import { type CalendarEvent } from "@/lib/services/calendar-service";
import { router } from "expo-router";
import { parseYmdFromDb, toYmd } from "@/lib/utils";

type DayViewProps = {
    currentDate: Date;
    events: Record<string, CalendarEvent[]>;
};

export const DayView = ({ currentDate, events }: DayViewProps) => {
    const { artist } = useAuth();
    const [eventsToday, setEventsToday] = useState<CalendarEvent[]>([]);
    const [gridStart, setGridStart] = useState<Date>(new Date());
    const [gridEnd, setGridEnd] = useState<Date>(new Date());

    useEffect(() => {
        const todayEvents = events[toYmd(currentDate)] || [];
        setEventsToday(todayEvents);
        const toDayKey = (dayIndex: number) => {
            const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
            return keys[dayIndex] || 'mon';
        };

        const parseHHMM = (s?: string) => {
            if (!s) return null;
            const match = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
            if (!match) return null;
            const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
            const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
            return { h, m };
        };

        const dayKey = toDayKey(currentDate.getDay());
        const startStr = (artist?.flow?.start_times || {})[dayKey] || '09:00';
        const endStr = (artist?.flow?.end_times || {})[dayKey] || '17:00';
        const parsedStart = parseHHMM(startStr) || { h: 9, m: 0 };
        const parsedEnd = parseHHMM(endStr) || { h: 17, m: 0 };

        let start = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), parsedStart.h, parsedStart.m, 0, 0);
        let end = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), parsedEnd.h, parsedEnd.m, 0, 0);

        // Adjust window: start -1 hour, end +1 hour relative to configured times
        start = new Date(start.getTime() - 60 * 60 * 1000);
        end = new Date(end.getTime() + 60 * 60 * 1000);

        // Ensure end is after start by at least 30 minutes
        if (end.getTime() <= start.getTime()) {
            end = new Date(start.getTime() + 30 * 60 * 1000);
        }
        const itemEvents = todayEvents.filter((ev) => ev.type === "item");
        if (itemEvents.length > 0) {
            const earliestEvent = itemEvents.reduce((min, ev) => {
                return parseYmdFromDb(ev.start_date) < parseYmdFromDb(min.start_date) ? ev : min;
            }, itemEvents[0]);
            const latestEvent = itemEvents.reduce((max, ev) => {
                return parseYmdFromDb(ev.end_date) > parseYmdFromDb(max.end_date) ? ev : max;
            }, itemEvents[0]);
            const parsedStart = parseHHMM(earliestEvent.start_date.split(' ')[1]) || { h: 9, m: 0 };
            const parsedEnd = parseHHMM(latestEvent.end_date.split(' ')[1]) || { h: 17, m: 0 };
            
            let eventStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), parsedStart.h, parsedStart.m, 0, 0);
            eventStart = new Date(eventStart.getTime() - 60 * 60 * 1000);
            let eventEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), parsedEnd.h, parsedEnd.m, 0, 0);
            eventEnd = new Date(eventEnd.getTime() + 60 * 60 * 1000);
            if (eventStart.getTime() < start.getTime()) start = eventStart;
            if (eventEnd.getTime() > end.getTime()) end = eventEnd;
        }

        console.log("start", start);
        console.log("end", end);
        setGridStart(start);
        setGridEnd(end);
    }, [events, currentDate, artist]);

    // Layout constants: each row is 30 minutes tall (40px), so 1 hour = 80px.
    const GRID_ROW_HEIGHT = 40;
    const HOUR_HEIGHT = GRID_ROW_HEIGHT * 2;
    const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
    // Use the grid window as the visible day range
    const dayStart = gridStart;
    const dayEnd = gridEnd;
    const parsedEvents = useMemo(() => {
        const parseDateTime = (s: string) => new Date((s || "").replace(" ", "T"));
        return (eventsToday || []).map((e) => ({
            ...e,
            startDate: parseDateTime(e.start_date),
            endDate: parseDateTime(e.end_date),
            allDay: !!e.allday,
        }));
    }, [eventsToday]);
    const timedEvents = useMemo(
        () =>
            parsedEvents.filter(
                (e) => !e.allDay && e.type === "item" && e.endDate >= dayStart && e.startDate <= dayEnd
            ),
        [parsedEvents, dayStart, dayEnd]
    );

    const backgroundEvents = useMemo(
        () =>
            parsedEvents.filter(
                (e) => !e.allDay && e.type === "background" && e.endDate >= dayStart && e.startDate <= dayEnd
            ),
        [parsedEvents, dayStart, dayEnd]
    );

    const timeSlots = useMemo(() => {
        const slots: { hour: number; minute: number; timeString: string }[] = [];

        const baseStartTotalMin = gridStart.getHours() * 60 + gridStart.getMinutes();
        const baseEndTotalMin = gridEnd.getHours() * 60 + gridEnd.getMinutes();

        let effectiveStartMin = baseStartTotalMin;
        let effectiveEndMin = baseEndTotalMin;

        const steps = Math.max(1, Math.ceil((effectiveEndMin - effectiveStartMin) / 30));

        for (let i = 0; i < steps; i++) {
            const total = effectiveStartMin + i * 30;
            const hour24 = Math.floor(total / 60);
            const minute = total % 60;

            let displayHour = hour24 % 12;
            if (displayHour === 0) displayHour = 12;
            const suffix = hour24 < 12 ? "am" : "pm";
            const minuteStr = minute.toString().padStart(2, "0");

            const timeString = `${displayHour}:${minuteStr} ${suffix}`;
            slots.push({ hour: hour24, minute, timeString });
        }
        return slots;
    }, [gridStart, gridEnd]);

    const dayContentHeight = useMemo(() => timeSlots.length * GRID_ROW_HEIGHT, [timeSlots.length]);

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
        else if (source === 'quick_appointment') {
            router.push({
                pathname: '/artist/calendar/quick-appointment/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'book_off') {
            router.push({
                pathname: '/artist/calendar/off-days/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'session' || source === 'lock') {
            router.push({
                pathname: '/artist/booking/session/detail-session',
                params: { client_id: null, project_id: null, session_id: source_id }
            });
        }
        else if (source === 'mark_unavailable') {
            router.push({
                pathname: '/artist/calendar/unavailable',
                params: { id: source_id }
            });
        }
    }
    return (
        <View className="flex-1 border border-border-secondary">
            {/* Header */}
            <View className="flex-row border-b border-border-secondary">
                <View className="w-20 h-10 justify-center items-center border-r border-border-secondary">
                    <Text className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                        Time
                    </Text>
                </View>
                <View className="flex-1 h-10 justify-center items-center">
                    <Text className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                        {dayNames[currentDate.getDay()]} {currentDate.getDate()}
                    </Text>
                </View>
            </View>

            {/* All-day band */}
            <View className="flex-row items-center border-b border-border-secondary" style={{ height: 28 }}>
                <View className="w-20 h-full justify-center items-center border-r border-border-secondary">
                    <Text className="text-[10px] text-text-secondary" style={{ letterSpacing: 1 }}>
                        All-day
                    </Text>
                </View>
                <View className="flex-1 h-full px-1 py-1 flex-row flex-wrap items-center">
                    {eventsToday
                        .filter(ev => ev.type === "background" || ev.allday === true)
                        .map((ev) => (
                            <Pressable
                                key={ev.id}
                                onPress={() => handleEventClick(ev.source, ev.source_id)}
                                className={`px-2 h-full items-center ${getEventColorClass(ev.color)}`}
                                style={{ opacity: 0.8, marginRight: 2, maxWidth: 100 }}
                            >
                                <Text numberOfLines={1} className="text-[14px] text-foreground font-medium leading-none">
                                    {ev.title || "Event"}
                                </Text>
                            </Pressable>
                        ))}
                </View>
            </View>

            {/* Time grid */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View style={{ height: dayContentHeight, position: "relative" }}>
                    {timeSlots.map((slot, index) => (
                        <View key={index} className="flex-row border-b border-border-secondary" style={{ height: GRID_ROW_HEIGHT }}>
                            <View className="w-20 justify-center items-center border-r border-border-secondary py-2">
                                <Text className="text-xs">{slot.timeString}</Text>
                            </View>
                            <View
                                className="flex-1 justify-center items-center py-2"
                            />
                        </View>
                    ))}
                    {/* Background overlays */}
                    {backgroundEvents.map((e, idx) => {
                        const startMs = Math.max(e.startDate.getTime(), dayStart.getTime());
                        const endMs = Math.min(e.endDate.getTime(), dayEnd.getTime());
                        const minutesFromStart = (startMs - dayStart.getTime()) / (1000 * 60);
                        const minutesDuration = Math.max(15, (endMs - startMs) / (1000 * 60));
                        return (
                            <View
                                key={`bg-${idx}`}
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    top: minutesFromStart * MINUTE_HEIGHT,
                                    left: 80,
                                    right: 0,
                                    height: minutesDuration * MINUTE_HEIGHT,
                                    backgroundColor: "#000",
                                    opacity: 0.06,
                                }}
                            />
                        );
                    })}
                    {/* Timed item events */}
                    {timedEvents.map((e, idx) => {
                        const startMs = Math.max(e.startDate.getTime(), dayStart.getTime());
                        const endMs = Math.min(e.endDate.getTime(), dayEnd.getTime());
                        const minutesFromStart = (startMs - dayStart.getTime()) / (1000 * 60);
                        const minutesDuration = Math.max(15, (endMs - startMs) / (1000 * 60));
                        return (
                            <Pressable
                                key={`item-${e.id}-${idx}`}
                                onPress={() => handleEventClick(e.source, e.source_id)}
                                style={{
                                    position: "absolute",
                                    top: minutesFromStart * MINUTE_HEIGHT,
                                    left: 86,
                                    right: 6,
                                    height: minutesDuration * MINUTE_HEIGHT,
                                    borderRadius: 2,
                                    paddingHorizontal: 6,
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                                className={`flex-row items-center ${getEventColorClass(e.color)}`}
                            >
                                {e.source === 'lock' && (
                                    <Text className="text-md text-foreground" style={{ marginRight: 2 }} numberOfLines={1}>$</Text>
                                )}
                                <Text className="text-md text-foreground" numberOfLines={2}>
                                    {e.title || "Event"}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};