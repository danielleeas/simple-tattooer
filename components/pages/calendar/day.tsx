import { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { dayNames, toLocalDateString, getEventColorClass } from "./utils";
import { useAuth } from "@/lib/contexts/auth-context";
import { getEventsInRange, type CalendarEvent } from "@/lib/services/calendar-service";
import { useFocusEffect } from "@react-navigation/native";

type DayViewProps = {
    currentDate: Date;
    onTimeSelect: (datetime: string) => void;
};

export const DayView = ({ currentDate, onTimeSelect }: DayViewProps) => {
    const { artist } = useAuth();
    const [eventsToday, setEventsToday] = useState<CalendarEvent[]>([]);

    const loadEvents = useCallback(async () => {
        if (!artist?.id) return;
        try {
            const res = await getEventsInRange({
                artistId: artist.id,
                start: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0),
                end: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999),
            });
            setEventsToday(res.events || []);
        } catch {
            setEventsToday([]);
        }
    }, [artist?.id, currentDate]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    useFocusEffect(
        useCallback(() => {
            loadEvents();
        }, [loadEvents])
    );

    const timeSlots = useMemo(() => {
        const slots: { hour: number; minute: number; timeString: string }[] = [];
        for (let i = 0; i < 48; i++) {
            const hour24 = Math.floor(i / 2);
            const minute = i % 2 === 0 ? 0 : 30;

            let displayHour = hour24 % 12;
            if (displayHour === 0) displayHour = 12;
            const suffix = hour24 < 12 ? "am" : "pm";
            const minuteStr = minute.toString().padStart(2, "0");

            const timeString = `${displayHour}:${minuteStr} ${suffix}`;
            slots.push({ hour: hour24, minute, timeString });
        }
        return slots;
    }, [currentDate]);

    // Layout constants: each row is 30 minutes tall (40px), so 1 hour = 80px.
    const GRID_ROW_HEIGHT = 40;
    const HOUR_HEIGHT = GRID_ROW_HEIGHT * 2;
    const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
    const dayStart = useMemo(
        () => new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0),
        [currentDate]
    );
    const dayEnd = useMemo(
        () => new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999),
        [currentDate]
    );
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
    const dayContentHeight = useMemo(() => timeSlots.length * GRID_ROW_HEIGHT, [timeSlots.length]);

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
                                className={`px-2 h-full items-center ${getEventColorClass(ev.color)}`}
                                style={{ opacity: 0.8, marginRight: 2, maxWidth: 100 }}
                                pointerEvents="none"
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
                            <Pressable
                                className="flex-1 justify-center items-center py-2"
                                onPress={() => {
                                    const selectedDateTime = new Date(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth(),
                                        currentDate.getDate(),
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
                            <View
                                key={`item-${e.id}-${idx}`}
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
                                className={`${getEventColorClass(e.color)}`}
                            >
                                <Text className="text-md text-foreground" numberOfLines={2}>
                                    {e.title || "Event"}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};