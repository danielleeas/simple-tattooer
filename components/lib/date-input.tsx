import React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { DatePicker } from '@/components/lib/date-picker';

interface DateInputProps {
    selectedDate?: Date;
    onDateSelect?: (date: Date) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    helperText?: string;
    errorText?: string;
    className?: string;
    dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MMM DD, YYYY' | 'MM DD';
    minDate?: Date;
    maxDate?: Date;
    modalTitle?: string;
    showCalendarIcon?: boolean;
}

function DateInput({
    selectedDate,
    onDateSelect,
    placeholder = 'Select date',
    disabled = false,
    error = false,
    helperText,
    errorText,
    className,
    dateFormat = 'MM/DD/YYYY',
    minDate,
    maxDate,
    modalTitle = 'Select Date',
    showCalendarIcon = true,
}: DateInputProps) {
    const toYmdLocal = (date?: Date): string | undefined => {
        if (!date) return undefined;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const parseYmdToLocalDate = (ymd?: string): Date | undefined => {
        if (!ymd) return undefined;
        const [y, m, d] = ymd.split('-').map(Number);
        if (!y || !m || !d) return undefined;
        return new Date(y, m - 1, d, 12);
    };

    return (
        <View className="w-full">
            <DatePicker
                selectedDateString={toYmdLocal(selectedDate)}
                onDateStringSelect={(dateStr) => {
                    const date = parseYmdToLocalDate(dateStr);
                    if (date && onDateSelect) onDateSelect(date);
                }}
                disabled={disabled}
                placeholder={placeholder}
                minDateString={toYmdLocal(minDate)}
                maxDateString={toYmdLocal(maxDate)}
                modalTitle={modalTitle}
                dateFormat={dateFormat}
                showCalendarIcon={showCalendarIcon}
                showTodayButton={false}
                className={cn(
                    'flex-row items-center justify-between h-10 px-3 py-2 border border-border-white rounded-lg',
                    error && 'border-destructive',
                    disabled && 'opacity-50',
                    className
                )}
            />
            {(() => {
                const textToShow = error ? errorText : helperText;
                return textToShow && textToShow.trim() ? (
                    <Text
                        className={cn(
                            "mt-1 text-base",
                            error ? "text-destructive" : "text-text-secondary"
                        )}
                    >
                        {textToShow}
                    </Text>
                ) : null;
            })()}
        </View>
    );
}

export { DateInput };
