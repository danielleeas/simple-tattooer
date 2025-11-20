import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { BookingDataProps } from "./type";
import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Collapse } from "@/components/lib/collapse";
import { TimeDurationPicker } from "@/components/lib/time-duration-picker";

interface BookingProps {
    bookingData: BookingDataProps;
    updateBookingData: (updates: Partial<BookingDataProps>) => void;
}

export const Booking = ({ bookingData, updateBookingData }: BookingProps) => {
    const [sessionsPerDayInput, setSessionsPerDayInput] = useState<string>(String(bookingData.sessionsPerDay ?? 0));
    const [maxBackToBackInput, setMaxBackToBackInput] = useState<string>(String(bookingData.maxBackToBack ?? 0));
    const [bufferDaysInput, setBufferDaysInput] = useState<string>(String(bookingData.bufferBetweenSessions ?? 0));

    useEffect(() => {
        setSessionsPerDayInput(String(bookingData.sessionsPerDay ?? 0));
        setMaxBackToBackInput(String(bookingData.maxBackToBack ?? 0));
        setBufferDaysInput(String(bookingData.bufferBetweenSessions ?? 0));
    }, [bookingData]);

    return (
        <View className="gap-4 mt-4">
            <View className="flex-row items-start gap-2">
                <Pressable className="flex-1 gap-2" onPress={() => updateBookingData({ multipleSessionsEnabled: !bookingData.multipleSessionsEnabled } as Partial<BookingDataProps>)}>
                    <Text className="text-xl leading-6">
                        Do you tattoo more than one session per day?
                    </Text>
                    <Text className="text-text-secondary leading-5 w-[230px]">If yes, you'll be able to set up your days here</Text>
                </Pressable>
                <Switch
                    checked={bookingData.multipleSessionsEnabled || false}
                    onCheckedChange={(checked) => updateBookingData({ multipleSessionsEnabled: checked } as Partial<BookingDataProps>)}
                />
            </View>

            {bookingData.multipleSessionsEnabled && (
                <View className="gap-4">
                    <View className="flex-row w-full gap-4 items-center">
                        <View className='flex-1 gap-20'>
                            <Text variant="h5" className="w-[200px]">How many sessions per day?</Text>
                        </View>
                        <View className='w-20'>
                            <Input
                                className="h-8"
                                value={sessionsPerDayInput}
                                onFocus={() => {
                                    if (sessionsPerDayInput === '0') {
                                        setSessionsPerDayInput('');
                                    }
                                }}
                                onChangeText={(text) => {
                                    setSessionsPerDayInput(text);
                                }}
                                onBlur={() => {
                                    const n = parseInt(sessionsPerDayInput, 10);
                                    const normalized = !isNaN(n) && n >= 0 ? n : 0;
                                    updateBookingData({ sessionsPerDay: normalized } as Partial<BookingDataProps>);
                                    setSessionsPerDayInput(String(normalized));
                                }}
                            />
                        </View>
                    </View>

                    <View className="items-start gap-2">
                        <Collapse title="How long is each session?" textClassName="text-xl">
                            <TimeDurationPicker
                                selectedDuration={bookingData.sessionDuration || 0}
                                onDurationSelect={(duration) => updateBookingData({ sessionDuration: duration } as Partial<BookingDataProps>)}
                                minuteInterval={15}
                                minDuration={15}
                                maxDuration={525}
                                modalTitle="Select Session Duration"
                            />
                        </Collapse>
                    </View>

                    <View className="gap-4">
                        <View className='flex-1 gap-1'>
                            <Text variant="h5">Break time between sessions</Text>
                            <Text className="text-text-secondary leading-none">Use this to space out your bookings during the day.</Text>
                        </View>
                        <View className='flex-1 w-full'>
                            <TimeDurationPicker
                                selectedDuration={bookingData.breakTime || 0}
                                onDurationSelect={(duration) => updateBookingData({ breakTime: duration } as Partial<BookingDataProps>)}
                                minuteInterval={15}
                                minDuration={15}
                                maxDuration={525}
                                modalTitle="Select Break Duration"
                            />
                        </View>
                    </View>
                </View>
            )}

            <View className="flex-row items-center gap-2">
                <Pressable className="flex-1 gap-1" onPress={() => updateBookingData({ backToBackEnabled: !bookingData.backToBackEnabled } as Partial<BookingDataProps>)}>
                    <Text className="text-xl leading-1">
                        Do you tattoo clients
                    </Text>
                    <Text className="text-xl leading-none">
                        on back-to-back days??
                    </Text>
                </Pressable>
                <Switch
                    checked={bookingData.backToBackEnabled || false}
                    onCheckedChange={(checked) => updateBookingData({ backToBackEnabled: checked } as Partial<BookingDataProps>)}
                />
            </View>

            {bookingData.backToBackEnabled && (
                <View className="flex-row w-full gap-4">
                    <View className='flex-1'>
                        <Text variant="h5">Max sessions back-to-back</Text>
                    </View>
                    <View className='w-20'>
                        <Input
                            className="h-8"
                            value={maxBackToBackInput}
                            onFocus={() => {
                                if (maxBackToBackInput === '0') {
                                    setMaxBackToBackInput('');
                                }
                            }}
                            onChangeText={(text) => {
                                setMaxBackToBackInput(text);
                            }}
                            onBlur={() => {
                                const n = parseInt(maxBackToBackInput, 10);
                                const normalized = !isNaN(n) && n >= 0 ? n : 0;
                                updateBookingData({ maxBackToBack: normalized } as Partial<BookingDataProps>);
                                setMaxBackToBackInput(String(normalized));
                            }}
                        />
                    </View>
                </View>
            )}

            <View className="flex-row w-full gap-4">
                <View className='flex-1 gap-1'>
                    <Text variant="h5">Buffer between sessions</Text>
                    <Text className="text-text-secondary leading-none">How many days in between sessions or back to back sets?</Text>
                </View>
                <View className='w-20'>
                    <Input
                        className="h-8"
                        value={bufferDaysInput}
                        onFocus={() => {
                            if (bufferDaysInput === '0') {
                                setBufferDaysInput('');
                            }
                        }}
                        onChangeText={(text) => {
                            setBufferDaysInput(text);
                        }}
                        onBlur={() => {
                            const n = parseInt(bufferDaysInput, 10);
                            const normalized = !isNaN(n) && n >= 0 ? n : 0;
                            updateBookingData({ bufferBetweenSessions: normalized } as Partial<BookingDataProps>);
                            setBufferDaysInput(String(normalized));
                        }}
                    />
                </View>
            </View>
        </View>
    )
}