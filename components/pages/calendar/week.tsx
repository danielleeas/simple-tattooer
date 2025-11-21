import { useMemo } from "react";
import { ScrollView, View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { dayNames, toLocalDateString } from "./utils";

type WeekViewProps = {
    currentDate: Date;
    onTimeSelect: (datetime: string) => void;
};

export const WeekView = ({ currentDate, onTimeSelect }: WeekViewProps) => {
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