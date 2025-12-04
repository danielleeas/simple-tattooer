import { ActivityIndicator, View, Pressable } from "react-native"
import { Text } from "@/components/ui/text"
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAvailableTimes } from "@/lib/services/booking-service";
import { Artist } from "@/lib/redux/types";
import { makeChunks } from "@/lib/utils";

interface StartTimesProps {
    date: string;
    sessionLength: number;
    breakTime: number;
    artist: Artist;
    onTimeSelect?: (date: string, time: string) => void;
}

export const StartTimes = ({ date, sessionLength, breakTime, artist, onTimeSelect }: StartTimesProps) => {
    const [loading, setLoading] = useState(false);
    const [startTimes, setStartTimes] = useState<{ value: string; label: string }[]>([]);

    const startTimesForDate = useCallback(async () => {
        try {
            setLoading(true);
            const times = await getAvailableTimes(artist, date, sessionLength, breakTime);
            setStartTimes(times);
        } catch (error) {
            console.warn('Failed to load start times:', error);
            setStartTimes([]);
        } finally {
            setLoading(false);
        }
    }, [artist, sessionLength, breakTime, date]);

    useEffect(() => {
        startTimesForDate();
    }, [startTimesForDate]);

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
                    if (startTimes.length === 0) {
                        return (
                            <View className="items-center justify-center py-4">
                                <Text variant="small" className="text-text-secondary">No available start times</Text>
                            </View>
                        );
                    }
                    return (
                        <View className="gap-2">
                        </View>
                    );
                })()
            )}
        </>
    )
}