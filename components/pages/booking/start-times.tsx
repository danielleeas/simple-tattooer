import { ActivityIndicator, View, Pressable, Modal } from "react-native"
import { Text } from "@/components/ui/text"
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAvailableTimes } from "@/lib/services/booking-service";
import { Artist } from "@/lib/redux/types";
import { convertTimeToHHMMString, makeChunks, parseHhMmToMinutes, minutesToDisplay, convertTimeToISOString } from "@/lib/utils";
import { TimePicker } from "@/components/lib/time-picker";

interface StartTimesProps {
    date: string;
    sessionLength: number;
    artist: Artist;
    locationId: string;
    selectedTime?: string; // HH:mm format
    onTimeSelect?: (date: string, time: string) => void;
}

export const StartTimes = ({ date, sessionLength, artist, locationId, selectedTime, onTimeSelect }: StartTimesProps) => {
    const [loading, setLoading] = useState(false);
    const [startTimes, setStartTimes] = useState<{ value: string; label: string }[]>([]);
    const [customTime, setCustomTime] = useState<Date | undefined>(undefined);

    const startTimesForDate = useCallback(async () => {
        try {
            setLoading(true);
            const times = await getAvailableTimes(artist, date, sessionLength, locationId);
            setStartTimes(times);
        } catch (error) {
            console.warn('Failed to load start times:', error);
            setStartTimes([]);
        } finally {
            setLoading(false);
        }
    }, [artist, sessionLength, date, locationId]);

    useEffect(() => {
        startTimesForDate();
    }, [startTimesForDate]);

    const handleCustomTimeSelect = (time: Date) => {
        setCustomTime(time)
        const timeString = convertTimeToHHMMString(time);
        const newTime = {
            value: timeString,
            label: minutesToDisplay(parseHhMmToMinutes(timeString)!)
        };

        setStartTimes((prev) => {
            // Avoid adding duplicate time entries
            const alreadyExists = prev.some((t) => t.value === timeString);
            if (alreadyExists) {
                return prev;
            }

            return [...prev, newTime].sort(
                (a, b) => (parseHhMmToMinutes(a.value) ?? 0) - (parseHhMmToMinutes(b.value) ?? 0)
            );
        });

        onTimeSelect?.(date, timeString);
    }

    useEffect(() => {
        if (!selectedTime) return;
        const selectedTimeIndex = startTimes.findIndex((t) => t.value === selectedTime);
        if (selectedTimeIndex === -1) {
            setStartTimes((prev) => [...prev, { value: selectedTime, label: minutesToDisplay(parseHhMmToMinutes(selectedTime)!) }].sort(
                (a, b) => (parseHhMmToMinutes(a.value) ?? 0) - (parseHhMmToMinutes(b.value) ?? 0)
            ));
        }
    }, [selectedTime, startTimes]);

    const startTimesChunks = useMemo(() => makeChunks(startTimes, 2), [startTimes]);

    return (
        <>
            {loading ? (
                <View className="items-center justify-center py-4">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text variant="small" className="text-text-secondary mt-2">Loading times...</Text>
                </View>
            ) : (
                (() => {
                    return (
                        <View className="gap-2">
                            {startTimesChunks.map((times, index) => (
                                <View key={index} className="flex-row items-center gap-2">
                                    {times.map((time, i) => {
                                        const isSelected = selectedTime === time.value;
                                        return (
                                            <Pressable
                                                key={index + i}
                                                onPress={() => onTimeSelect?.(date, time.value)}
                                                className={`rounded-full border items-center justify-center h-8 flex-1 ${isSelected
                                                    ? 'border-foreground bg-foreground'
                                                    : 'border-border-white'
                                                    }`}
                                            >
                                                <Text
                                                    variant="small"
                                                    className={isSelected ? 'text-background' : 'text-foreground'}
                                                >
                                                    {time.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            ))}
                            <View className="flex-row items-center gap-2">
                                <TimePicker
                                    minuteInterval={15}
                                    selectedTime={customTime}
                                    onTimeSelect={handleCustomTimeSelect}
                                    customHandle={true}
                                />
                            </View>
                        </View>
                    );
                })()
            )}
        </>
    )
}