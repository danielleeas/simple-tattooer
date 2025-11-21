import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { CalendarDay, dayNames, toLocalDateString } from "./utils";

type MonthViewProps = {
    currentDate: Date;
    onDatePress: (dateString: string) => void;
};

export const MonthView = ({ currentDate, onDatePress }: MonthViewProps) => {
    const isSameDay = (a: Date, b: Date) =>
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear();

    const calendarDays: CalendarDay[] = useMemo(() => {
        const today = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstOfMonth = new Date(year, month, 1);
        const startDate = new Date(firstOfMonth);
        startDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay()); // start on Sunday

        const days: CalendarDay[] = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const inMonth = date.getMonth() === month;
            days.push({
                date,
                isCurrentMonth: inMonth,
                isToday: isSameDay(date, today),
            });
        }
        return days;
    }, [currentDate]);

    return (
        <View className="flex-1 gap-0">
            <View className="flex-row border border-border-secondary">
                {dayNames.map((name, idx) => (
                    <View
                        key={name}
                        className="flex-1 h-10 justify-center items-center py-2 border-r border-border-secondary"
                        style={idx === 6 ? { borderRightWidth: 0 } : {}}
                    >
                        <Text variant="p" className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                            {name}
                        </Text>
                    </View>
                ))}
            </View>

            <View className="flex-1">
                {Array.from({ length: 6 }, (_, weekIndex) => (
                    <View
                        key={weekIndex}
                        className="flex-row flex-1 border-border-secondary"
                        style={{ borderLeftWidth: 1 }}
                    >
                        {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                            const showToday = day.isToday;
                            const bubbleClasses = showToday ? "border border-primary" : "";

                            return (
                                <Pressable
                                    key={`${weekIndex}-${dayIndex}`}
                                    onPress={() => onDatePress(toLocalDateString(day.date))}
                                    className="flex-1 items-center pt-2 justify-start border-border-secondary border-r border-b relative"
                                >
                                    <View className={`rounded-full relative items-center justify-center ${bubbleClasses}`} style={{ width: 24, height: 24 }}>
                                        <Text
                                            className={`text-xs ${showToday ? 'text-primary' : 'text-foreground'}`}
                                            style={!day.isCurrentMonth ? { opacity: 0.5 } : {}}
                                        >
                                            {day.date.getDate()}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
};