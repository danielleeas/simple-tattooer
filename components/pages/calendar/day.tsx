import { useMemo } from "react";
import { View, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { dayNames } from "./utils";

type DayViewProps = {
    currentDate: Date;
};

export const DayView = ({ currentDate }: DayViewProps) => {
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

            {/* Time grid */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {timeSlots.map((slot, index) => (
                    <View key={index} className="flex-row border-b border-border-secondary" style={{ height: 40 }}>
                        <View className="w-20 justify-center items-center border-r border-border-secondary py-2">
                            <Text className="text-xs">{slot.timeString}</Text>
                        </View>
                        <View className="flex-1 justify-center items-center py-2" />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};