import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface WeekdayToggleProps {
    selectedDays: string[];
    onToggleDay: (day: string) => void;
    className?: string;
}

const WEEKDAYS = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

export function WeekdayToggle({ selectedDays, onToggleDay, className }: WeekdayToggleProps) {
    const isSelected = (day: string) => selectedDays.includes(day);

    return (
        <View className={cn('gap-3', className)}>
            {/* First row: Mon, Tue, Wed, Thu */}
            <View className="flex-row gap-3">
                {WEEKDAYS.slice(0, 4).map((day) => (
                    <Pressable
                        key={day.key}
                        onPress={() => onToggleDay(day.key)}
                        className={cn(
                            'flex-1 h-8 rounded-full items-center justify-center',
                            isSelected(day.key)
                                ? 'bg-foreground border border-border-white'
                                : 'bg-background border border-border-white'
                        )}
                    >
                        <Text
                            className={cn(
                                'text-sm font-medium',
                                isSelected(day.key)
                                    ? 'text-background'
                                    : 'text-foreground'
                            )}
                        >
                            {day.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Second row: Fri, Sat, Sun */}
            <View className="flex-row gap-3"> 
                {WEEKDAYS.slice(4, 7).map((day) => (
                    <Pressable
                        key={day.key}
                        onPress={() => onToggleDay(day.key)}
                        className={cn(
                            'flex-1 h-8 rounded-full items-center justify-center',
                            isSelected(day.key)
                                ? 'bg-foreground border border-border-white'
                                : 'bg-background border border-border-white'
                        )}
                    >
                        <Text
                            className={cn(
                                'text-sm font-medium',
                                isSelected(day.key)
                                    ? 'text-background'
                                    : 'text-foreground'
                            )}
                        >
                            {day.label}
                        </Text>
                    </Pressable>
                ))}
                <View className="flex-1 h-10 rounded-full items-center justify-center"></View>
            </View>
        </View>
    );
}
