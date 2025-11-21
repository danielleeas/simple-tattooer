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
                                style={{ opacity: 0.8, marginRight: 2, maxWidth: 80 }}
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
                {timeSlots.map((slot, index) => (
                    <View key={index} className="flex-row border-b border-border-secondary" style={{ height: 40 }}>
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
            </ScrollView>
        </View>
    );
};