import React, { useState, useMemo, useRef } from 'react';
import { View, Pressable, ScrollView, Image, Modal, PanResponder } from 'react-native';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { THEME } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';

// Date picker variants
const datePickerVariants = cva(
    'items-center justify-center rounded-lg',
    {
        variants: {
            variant: {
                default: '',
                selected: '',
                disabled: '',
            },
            size: {
                default: 'h-10 w-10',
                small: 'h-8 w-8',
                large: 'h-12 w-12',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

// Size configuration for different components
const sizeConfig = {
    small: {
        daySize: 28,
        dayFontSize: 12,
        weekdayFontSize: 10,
        headerFontSize: 14,
        monthYearFontSize: 14,
        todayButtonPadding: 6,
        navigationButtonSize: 16,
        gap: 2,
        padding: 8,
    },
    default: {
        daySize: 32,
        dayFontSize: 14,
        weekdayFontSize: 12,
        headerFontSize: 16,
        monthYearFontSize: 16,
        todayButtonPadding: 8,
        navigationButtonSize: 20,
        gap: 4,
        padding: 12,
    },
    large: {
        daySize: 40,
        dayFontSize: 16,
        weekdayFontSize: 14,
        headerFontSize: 18,
        monthYearFontSize: 18,
        todayButtonPadding: 10,
        navigationButtonSize: 24,
        gap: 6,
        padding: 16,
    },
};

export interface DatePickerProps {
    // Preferred when your backend stores YYYY-MM-DD. Parsed as local dates.
    selectedDateString?: string;
    selectedDatesStrings?: string[];
    onDateStringSelect?: (date: string) => void; // Local date string YYYY-MM-DD
    onDatesStringSelect?: (dates: string[]) => void; // Local date strings YYYY-MM-DD
    // Availability: if provided, any date not in this list is disabled
    availableDates?: string[]; // YYYY-MM-DD
    // Month change callback (year is 4-digit, month is 0-11)
    onMonthChange?: (year: number, month: number) => void;
    disabled?: boolean;
    size?: 'small' | 'default' | 'large';
    className?: string;
    placeholder?: string;
    // String constraints parsed as local dates (YYYY-MM-DD)
    minDateString?: string;
    maxDateString?: string;
    // Modal props
    showModal?: boolean;
    modalTitle?: string;
    // Inline picker props
    showInline?: boolean;
    // Date format
    dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MMM DD, YYYY' | 'MM DD';
    // Show calendar icon
    showCalendarIcon?: boolean;
    // Show "Today" button
    showTodayButton?: boolean;
    // Selection mode
    selectionMode?: 'single' | 'multiple' | 'range';
    maxSelections?: number; // Maximum number of dates that can be selected
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
    isMultiSelected?: boolean; // For multiple selection mode
    // Range selection flags
    isInRange?: boolean;
    isRangeStart?: boolean;
    isRangeEnd?: boolean;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Format date for display
const formatDate = (date: Date, format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MMM DD, YYYY' | 'MM DD'): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const monthName = MONTHS[date.getMonth()];
    const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];

    switch (format) {
        case 'MM/DD/YYYY':
            return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
        case 'DD/MM/YYYY':
            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        case 'MMM DD, YYYY':
            return `${monthName} ${day.toString().padStart(2, '0')}, ${year}`;
        case 'MM DD':
            return `${monthAbbr} ${day}`;
        default:
            return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
    }
};

// Native mobile calendar picker component
const NativeCalendarPicker = ({
    selectedDate,
    selectedDates,
    onDateSelect,
    onDatesSelect,
    onDateStringSelect,
    onDatesStringSelect,
    availableDates,
    onMonthChange,
    minDate,
    maxDate,
    selectionMode = 'single',
    maxSelections,
    size = 'default',
    disabled = false,
    showTodayButton = true,
}: {
    selectedDate?: Date;
    selectedDates?: Date[];
    onDateSelect?: (date: Date) => void;
    onDatesSelect?: (dates: Date[]) => void;
    onDateStringSelect?: (date: string) => void;
    onDatesStringSelect?: (dates: string[]) => void;
    availableDates?: string[];
    onMonthChange?: (year: number, month: number) => void;
    minDate?: Date;
    maxDate?: Date;
    selectionMode?: 'single' | 'multiple' | 'range';
    maxSelections?: number;
    size?: 'small' | 'default' | 'large';
    disabled?: boolean;
    showTodayButton?: boolean;
}) => {
    const [currentMonth, setCurrentMonth] = useState(
        selectedDate || selectedDates?.[0] || new Date()
    );
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
    const [tempSelectedDates, setTempSelectedDates] = useState<Date[]>(
        selectedDates || (selectedDate ? [selectedDate] : [])
    );

    // Get size configuration
    const config = sizeConfig[size];

    // Helper functions
    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const toYmd = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const availableSet = React.useMemo(() => {
        return new Set(availableDates || []);
    }, [availableDates]);

    const isDateDisabled = (date: Date) => {
        if (minDate && date < minDate) {
            return true;
        }
        if (maxDate && date > maxDate) {
            return true;
        }
        // If availableDates prop is provided (even if empty), only allow those dates.
        if (availableDates !== undefined) {
            return !availableSet.has(toYmd(date));
        }
        return false;
    };

    // Notify parent when current month changes
    React.useEffect(() => {
        onMonthChange?.(currentMonth.getFullYear(), currentMonth.getMonth());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMonth.getFullYear(), currentMonth.getMonth()]);

    // Generate calendar days for the current month
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        // First day of the week (Sunday = 0)
        const firstDayOfWeek = firstDay.getDay();
        // Number of days in the month
        const daysInMonth = lastDay.getDate();

        const days: CalendarDay[] = [];
        const today = new Date();

        // Helper: sorted range dates if in range mode
        const rangeDates = selectionMode === 'range' && selectedDates && selectedDates.length > 0
            ? [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
            : [] as Date[];

        // Helper function to check if date is selected (single points or multi)
        const isDateSelected = (date: Date) => {
            if (selectionMode === 'multiple' && selectedDates) {
                return selectedDates.some(d => isSameDay(date, d));
            }
            if (selectionMode === 'range' && rangeDates.length > 0) {
                const start = rangeDates[0];
                const end = rangeDates[rangeDates.length - 1];
                return isSameDay(date, start) || (end ? isSameDay(date, end) : false);
            }
            return selectedDate ? isSameDay(date, selectedDate) : false;
        };

        // Precompute range helpers for flags
        const isInRangeDate = (date: Date) => selectionMode === 'range' && rangeDates.some(d => isSameDay(date, d));
        const isRangeStartDate = (date: Date) => selectionMode === 'range' && rangeDates.length > 0 && isSameDay(date, rangeDates[0]);
        const isRangeEndDate = (date: Date) => selectionMode === 'range' && rangeDates.length > 1 && isSameDay(date, rangeDates[rangeDates.length - 1]);

        // Add days from previous month
        // Calculate how many days we need from previous month
        const prevMonthDaysNeeded = firstDayOfWeek;
        for (let i = prevMonthDaysNeeded - 1; i >= 0; i--) {
            const dayNumber = new Date(year, month, 0).getDate() - i;
            const date = new Date(year, month - 1, dayNumber);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: isSameDay(date, today),
                isSelected: isDateSelected(date),
                isDisabled: isDateDisabled(date),
                isMultiSelected: selectionMode === 'multiple' && isDateSelected(date),
                isInRange: isInRangeDate(date),
                isRangeStart: isRangeStartDate(date),
                isRangeEnd: isRangeEndDate(date),
            });
        }

        // Add days from current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push({
                date,
                isCurrentMonth: true,
                isToday: isSameDay(date, today),
                isSelected: isDateSelected(date),
                isDisabled: isDateDisabled(date),
                isMultiSelected: selectionMode === 'multiple' && isDateSelected(date),
                isInRange: isInRangeDate(date),
                isRangeStart: isRangeStartDate(date),
                isRangeEnd: isRangeEndDate(date),
            });
        }

        // Add days from next month to complete the grid
        const remainingDays = 42 - days.length; // 6 weeks * 7 days
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: isSameDay(date, today),
                isSelected: isDateSelected(date),
                isDisabled: isDateDisabled(date),
                isMultiSelected: selectionMode === 'multiple' && isDateSelected(date),
                isInRange: isInRangeDate(date),
                isRangeStart: isRangeStartDate(date),
                isRangeEnd: isRangeEndDate(date),
            });
        }

        return days;
    }, [currentMonth, selectedDate, selectedDates, minDate, maxDate, selectionMode, availableSet]);

    const handleDatePress = (day: CalendarDay) => {
        if (disabled || day.isDisabled) return;

        // Normalize outgoing dates to noon local time to avoid UTC date shifts when serialized
        const normalizeOutputDate = (date: Date) =>
            new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);

        if (selectionMode === 'multiple') {
            const newSelectedDates = [...tempSelectedDates];
            const existingIndex = newSelectedDates.findIndex(date => isSameDay(date, day.date));

            if (existingIndex >= 0) {
                // Remove date if already selected
                newSelectedDates.splice(existingIndex, 1);
            } else {
                // Add date if not selected and under max limit
                if (!maxSelections || newSelectedDates.length < maxSelections) {
                    newSelectedDates.push(normalizeOutputDate(day.date));
                }
            }

            setTempSelectedDates(newSelectedDates);
            onDatesSelect?.(newSelectedDates);
            onDatesStringSelect?.(newSelectedDates.map(d => toYmd(d)));
        } else if (selectionMode === 'range') {
            const newSelectedDates = [...tempSelectedDates];
            if (newSelectedDates.length === 0) {
                // Set start
                newSelectedDates.push(normalizeOutputDate(day.date));
                setTempSelectedDates(newSelectedDates);
                onDatesSelect?.(newSelectedDates);
                onDatesStringSelect?.(newSelectedDates.map(d => toYmd(d)));
            } else if (newSelectedDates.length === 1) {
                // Build full inclusive range between start and end
                const start = new Date(Math.min(newSelectedDates[0].getTime(), day.date.getTime()));
                const end = new Date(Math.max(newSelectedDates[0].getTime(), day.date.getTime()));
                const range: Date[] = [];
                const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                while (cursor <= end) {
                    range.push(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 12));
                    cursor.setDate(cursor.getDate() + 1);
                }
                setTempSelectedDates(range);
                onDatesSelect?.(range);
                onDatesStringSelect?.(range.map(d => toYmd(d)));
            } else {
                // Reset and start a new range
                const normalized = normalizeOutputDate(day.date);
                setTempSelectedDates([normalized]);
                onDatesSelect?.([normalized]);
                onDatesStringSelect?.([toYmd(normalized)]);
            }
        } else {
            onDateSelect?.(normalizeOutputDate(day.date));
            onDateStringSelect?.(toYmd(day.date));
        }
    };

    const goToPreviousMonth = () => {
        if (disabled) return;
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        if (disabled) return;
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const goToToday = () => {
        if (disabled) return;
        setCurrentMonth(new Date());
    };

    const handleMonthSelect = (month: number) => {
        if (disabled) return;
        const newDate = new Date(currentMonth.getFullYear(), month, 1);
        setCurrentMonth(newDate);
        setIsMonthPickerOpen(false);
    };

    const handleYearSelect = (year: number) => {
        if (disabled) return;
        const newDate = new Date(year, currentMonth.getMonth(), 1);
        setCurrentMonth(newDate);
        setIsYearPickerOpen(false);
    };

    const generateYearRange = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        // Generate a wide range for better UX (1900 to current year + 50)
        for (let i = 1900; i <= currentYear + 50; i++) {
            years.push(i);
        }
        return years;
    };

    // Swipe gesture to navigate months (left = next, right = previous)
    const swipeThreshold = 50;
    const panResponder = React.useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_evt, gestureState) => {
                if (disabled) return false;
                const dx = gestureState.dx;
                const dy = gestureState.dy;
                return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy);
            },
            onPanResponderRelease: (_evt, gestureState) => {
                if (disabled) return;
                const dx = gestureState.dx;
                if (dx <= -swipeThreshold) {
                    goToNextMonth();
                } else if (dx >= swipeThreshold) {
                    goToPreviousMonth();
                }
            },
            onPanResponderTerminationRequest: () => true,
        })
    ).current;

    // Get day style based on state
    const getDayStyle = (day: CalendarDay) => {
        const baseStyle: any = {};

        if (day.isSelected) {
            if (day.isToday) {
                baseStyle.backgroundColor = THEME.dark.primary;
                baseStyle.borderWidth = 1;
                baseStyle.borderColor = THEME.dark.primary;
            } else if (selectionMode === 'multiple' && day.isMultiSelected) {
                baseStyle.backgroundColor = THEME.dark.accent;
                baseStyle.borderWidth = 2;
                baseStyle.borderColor = THEME.dark.primary;
            } else if (selectionMode !== 'range' && !day.isInRange) {
                baseStyle.backgroundColor = THEME.dark.primary;
            }
        } else if (day.isToday) {
            baseStyle.backgroundColor = THEME.dark.backgroundTertiary;
            baseStyle.borderWidth = 1;
            baseStyle.borderColor = THEME.dark.primary;
        } else if (!day.isCurrentMonth) {
            baseStyle.opacity = 0.3;
        }

        if (day.isDisabled) {
            baseStyle.opacity = 0.3;
        }

        return baseStyle;
    };

    // Get day text color
    const getDayTextColor = (day: CalendarDay) => {
        if (day.isSelected) {
            if (selectionMode === 'multiple' && day.isMultiSelected) {
                return THEME.dark.foreground;
            } else if (selectionMode !== 'range' && !day.isInRange) {
                return THEME.dark.accent;
            }
        } else if (selectionMode === 'range' && day.isInRange) {
            return THEME.dark.primary;
        } else if (day.isToday) {
            return THEME.dark.primary;
        } else if (!day.isCurrentMonth) {
            return THEME.dark.textSecondary;
        } else if (day.isDisabled) {
            return THEME.dark.textSecondary;
        }
        return THEME.dark.textSecondary;
    };

    // Native mobile year picker component
    const NativeYearPicker = () => {
        const scrollViewRef = useRef<ScrollView>(null);
        const years = generateYearRange();
        const currentYear = currentMonth.getFullYear();
        const itemHeight = 50; // Height of each year item
        const visibleItems = 3; // Show 3 years at once
        const containerHeight = itemHeight * visibleItems; // Height to show exactly 3 items

        // Calculate initial scroll position to center current year
        const currentYearIndex = years.indexOf(currentYear);
        const initialScrollY = Math.max(0, ((currentYearIndex + 1) * itemHeight) - (containerHeight / 2) + (itemHeight / 2));

        React.useEffect(() => {
            // Scroll to current year when modal opens
            if (isYearPickerOpen && scrollViewRef.current) {
                scrollViewRef.current?.scrollTo({
                    y: initialScrollY,
                    animated: false // Use false for immediate positioning, then animate
                });
            }
        }, [isYearPickerOpen, initialScrollY]);

        return (
            <View style={{ height: containerHeight, width: '100%' }}>
                <ScrollView
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{
                        paddingVertical: containerHeight / 2 - itemHeight / 2,
                        width: '100%'
                    }}
                    snapToInterval={itemHeight}
                    decelerationRate="fast"
                    style={{ width: '100%' }}
                >
                    {years.map((year) => (
                        <Pressable
                            key={year}
                            onPress={() => handleYearSelect(year)}
                            style={{
                                height: itemHeight,
                                width: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 20,
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    height: 50,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderRadius: 4,
                                    backgroundColor: currentYear === year
                                        ? THEME.dark.accent
                                        : 'transparent',
                                }}
                            >
                                <Text
                                    variant="h6"
                                    style={{
                                        color: currentYear === year
                                            ? THEME.dark.foreground
                                            : THEME.dark.textSecondary,
                                        fontWeight: currentYear === year ? '600' : '400',
                                        fontSize: currentYear === year ? 18 : 16,
                                    }}
                                >
                                    {year}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={{ width: '100%', opacity: disabled ? 0.5 : 1 }} {...panResponder.panHandlers}>
            {showTodayButton && (
                <View className="flex-row items-center justify-center">
                    <Pressable
                        onPress={goToToday}
                        className="rounded-lg border border-border-secondary"
                        style={{ 
                            backgroundColor: 'transparent',
                            padding: config.todayButtonPadding
                        }}
                        disabled={disabled}
                    >
                        <Text 
                            variant="small" 
                            className="text-text-secondary"
                            style={{ fontSize: config.headerFontSize }}
                        >
                            Today
                        </Text>
                    </Pressable>
                </View>
            )}
            {/* Header with month/year and navigation */}
            <View className="flex-row items-center justify-between mb-4">
                <Pressable
                    onPress={goToPreviousMonth}
                    className="rounded-lg"
                    style={{ 
                        backgroundColor: 'transparent',
                        padding: config.padding / 2
                    }}
                    disabled={disabled}
                >
                    <Icon as={ChevronLeft} size={config.navigationButtonSize} color={THEME.dark.textSecondary} />
                </Pressable>

                <View className="flex-1 items-center">
                    <View className="flex-row items-center gap-1">
                        {/* Month Picker */}
                        <Pressable 
                            className="flex-row items-center gap-1 pl-3 pr-2 py-1"
                            onPress={() => !disabled && setIsMonthPickerOpen(true)}
                            disabled={disabled}
                        >
                            <Text 
                                variant="h6" 
                                className="text-center"
                                style={{ fontSize: config.monthYearFontSize }}
                            >
                                {MONTHS[currentMonth.getMonth()]}
                            </Text>
                            <Icon as={ChevronDown} size={config.navigationButtonSize * 0.8} color={THEME.dark.foreground} />
                        </Pressable>

                        <Modal
                            visible={isMonthPickerOpen}
                            animationType="fade"
                            transparent={true}
                            onRequestClose={() => setIsMonthPickerOpen(false)}
                        >
                            <View style={{
                                flex: 1,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 20,
                            }}>
                                <View style={{
                                    backgroundColor: THEME.dark.backgroundSecondary,
                                    borderRadius: 12,
                                    width: '100%',
                                    maxWidth: 400,
                                    shadowColor: '#000',
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }}>
                                    {/* Header */}
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingHorizontal: 20,
                                        paddingVertical: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: THEME.dark.border,
                                    }}>
                                        <Text variant="h4" style={{ color: THEME.dark.foreground }}>
                                            Select Month
                                        </Text>
                                        <Pressable
                                            onPress={() => setIsMonthPickerOpen(false)}
                                            style={{
                                                padding: 8,
                                                borderRadius: 8,
                                            }}
                                        >
                                            <Icon as={X} size={20} color={THEME.dark.textSecondary} />
                                        </Pressable>
                                    </View>

                                    {/* Content */}
                                    <View style={{ padding: 20 }}>
                                        <View className="flex-row flex-wrap gap-3">
                                            {MONTHS.map((month, index) => (
                                                <Pressable
                                                    key={index}
                                                    onPress={() => handleMonthSelect(index)}
                                                    className="flex-1 min-w-[25%]"
                                                    style={{
                                                        maxWidth: '30%'
                                                    }}
                                                >
                                                    <View
                                                        className="p-4 rounded-lg border"
                                                        style={{
                                                            backgroundColor: currentMonth.getMonth() === index
                                                                ? THEME.dark.accent
                                                                : THEME.dark.backgroundTertiary,
                                                            borderColor: currentMonth.getMonth() === index
                                                                ? THEME.dark.accent
                                                                : THEME.dark.border,
                                                            borderWidth: 1,
                                                        }}
                                                    >
                                                        <Text
                                                            variant="small"
                                                            style={{
                                                                color: currentMonth.getMonth() === index
                                                                    ? THEME.dark.foreground
                                                                    : THEME.dark.textSecondary,
                                                                textAlign: 'center',
                                                                fontWeight: currentMonth.getMonth() === index ? '600' : '400'
                                                            }}
                                                        >
                                                            {month.slice(0, 3)}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </Modal>

                        <Text variant="h5" className="text-center"> </Text>

                        {/* Year Picker */}
                        <Pressable 
                            className="flex-row items-center gap-1 pl-3 pr-2 py-1"
                            onPress={() => !disabled && setIsYearPickerOpen(true)}
                            disabled={disabled}
                        >
                            <Text 
                                variant="h6" 
                                className="text-center"
                                style={{ fontSize: config.monthYearFontSize }}
                            >
                                {currentMonth.getFullYear()}
                            </Text>
                            <Icon as={ChevronDown} size={config.navigationButtonSize * 0.8} color={THEME.dark.foreground} />
                        </Pressable>

                        <Modal
                            visible={isYearPickerOpen}
                            animationType="fade"
                            transparent={true}
                            onRequestClose={() => setIsYearPickerOpen(false)}
                        >
                            <View style={{
                                flex: 1,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 20,
                            }}>
                                <View style={{
                                    backgroundColor: THEME.dark.backgroundSecondary,
                                    borderRadius: 12,
                                    width: '100%',
                                    maxWidth: 400,
                                    shadowColor: '#000',
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }}>
                                    {/* Header */}
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingHorizontal: 20,
                                        paddingVertical: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: THEME.dark.border,
                                    }}>
                                        <Text variant="h4" style={{ color: THEME.dark.foreground }}>
                                            Select Year
                                        </Text>
                                        <Pressable
                                            onPress={() => setIsYearPickerOpen(false)}
                                            style={{
                                                padding: 8,
                                                borderRadius: 8,
                                            }}
                                        >
                                            <Icon as={X} size={20} color={THEME.dark.textSecondary} />
                                        </Pressable>
                                    </View>

                                    {/* Content */}
                                    <View style={{ padding: 20 }}>
                                        <NativeYearPicker />
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </View>
                </View>

                <Pressable
                    onPress={goToNextMonth}
                    className="rounded-lg"
                    style={{ 
                        backgroundColor: 'transparent',
                        padding: config.padding / 2
                    }}
                    disabled={disabled}
                >
                    <Icon as={ChevronRight} size={config.navigationButtonSize} color={THEME.dark.textSecondary} />
                </Pressable>
            </View>

            {/* Weekday headers */}
            <View className="flex-row mb-2">
                {WEEKDAYS.map((day) => (
                    <View key={day} className="flex-1 items-center justify-center" style={{ height: config.daySize }}>
                        <Text 
                            variant="small" 
                            className="text-text-secondary"
                            style={{ fontSize: config.weekdayFontSize }}
                        >
                            {day}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Calendar grid */}
            <View style={{ gap: config.gap }}>
                {Array.from({ length: 6 }, (_, weekIndex) => (
                    <View key={weekIndex} className="flex-row">
                        {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                            <View
                                key={`${weekIndex}-${dayIndex}`}
                                className='flex-1 items-center justify-center'
                                style={{ position: 'relative', height: config.daySize }}
                            >
                                {selectionMode === 'range' && day.isInRange && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            height: config.daySize,
                                            justifyContent: 'center',
                                        }}
                                        pointerEvents="none"
                                    >
                                        <View
                                            style={{
                                                height: config.daySize,
                                                width: '100%',
                                                backgroundColor: THEME.dark.backgroundTertiary,
                                                borderTopLeftRadius: day.isRangeStart ? config.daySize / 2 : 0,
                                                borderBottomLeftRadius: day.isRangeStart ? config.daySize / 2 : 0,
                                                borderTopRightRadius: day.isRangeEnd ? config.daySize / 2 : 0,
                                                borderBottomRightRadius: day.isRangeEnd ? config.daySize / 2 : 0,
                                            }}
                                        />
                                    </View>
                                )}
                                <Pressable
                                    onPress={() => handleDatePress(day)}
                                    className="rounded-full relative items-center justify-center"
                                    style={{
                                        ...getDayStyle(day),
                                        width: config.daySize,
                                        height: config.daySize,
                                    }}
                                    disabled={disabled || day.isDisabled}
                                >
                                    <Text
                                        variant="small"
                                        className="text-text-secondary"
                                        style={{ 
                                            color: getDayTextColor(day),
                                            fontSize: config.dayFontSize
                                        }}
                                    >
                                        {day.date.getDate()}
                                    </Text>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
};

// Inline date picker component
const InlineDatePicker = ({
    selectedDate,
    selectedDates,
    onDateStringSelect,
    onDatesStringSelect,
    availableDates,
    onMonthChange,
    minDate,
    maxDate,
    className,
    selectionMode = 'single',
    maxSelections,
    size = 'default',
    disabled = false,
    showTodayButton,
}: {
    selectedDate?: Date;
    selectedDates?: Date[];
    onDateStringSelect?: (date: string) => void;
    onDatesStringSelect?: (dates: string[]) => void;
    availableDates?: string[];
    onMonthChange?: (year: number, month: number) => void;
    minDate?: Date;
    maxDate?: Date;
    className?: string;
    selectionMode?: 'single' | 'multiple' | 'range';
    maxSelections?: number;
    size?: 'small' | 'default' | 'large';
    disabled?: boolean;
    showTodayButton?: boolean;
}) => {
    return (
        <View className={cn('w-full', className)}>
            <NativeCalendarPicker
                selectedDate={selectedDate}
                selectedDates={selectedDates}
                onDateStringSelect={onDateStringSelect}
                onDatesStringSelect={onDatesStringSelect}
                availableDates={availableDates}
                onMonthChange={onMonthChange}
                minDate={minDate}
                maxDate={maxDate}
                selectionMode={selectionMode}
                maxSelections={maxSelections}
                size={size}
                disabled={disabled}
                showTodayButton={showTodayButton}
            />
        </View>
    );
};

function DatePicker({
    selectedDateString,
    selectedDatesStrings,
    onDateStringSelect,
    onDatesStringSelect,
    availableDates,
    onMonthChange,
    disabled = false,
    size = 'default',
    className,
    placeholder = 'Select date',
    minDateString,
    maxDateString,
    showModal = true,
    modalTitle = 'Select Date',
    showInline = false,
    dateFormat = 'MM/DD/YYYY',
    showCalendarIcon = true,
    showTodayButton = true,
    selectionMode = 'single',
    maxSelections,
}: DatePickerProps) {
    // Helpers to ensure local-only handling
    const parseYmdToLocalDate = (ymd?: string): Date | undefined => {
        if (!ymd) return undefined;
        const [y, m, d] = ymd.split('-').map(Number);
        if (!y || !m || !d) return undefined;
        return new Date(y, m - 1, d, 12); // noon local
    };
    const normalizeLocalNoon = (d?: Date): Date | undefined => {
        if (!d) return undefined;
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
    };

    // Prefer string props when provided; otherwise normalize Date props
    const effectiveSelectedDate = parseYmdToLocalDate(selectedDateString);
    const effectiveSelectedDates = (selectedDatesStrings && selectedDatesStrings.length > 0
        ? selectedDatesStrings.map(parseYmdToLocalDate).filter(Boolean) as Date[]
        : []);

    const effectiveMinDate = parseYmdToLocalDate(minDateString);
    const effectiveMaxDate = parseYmdToLocalDate(maxDateString);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(effectiveSelectedDate);
    const [tempSelectedDates, setTempSelectedDates] = useState<Date[]>(
        effectiveSelectedDates || (effectiveSelectedDate ? [effectiveSelectedDate] : [])
    );

    const handleDateSelect = (date: Date) => {
        setTempSelectedDate(date);
    };

    const handleDatesSelect = (dates: Date[]) => {
        setTempSelectedDates(dates);
    };

    const toYmdLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const handleConfirm = () => {
        if (selectionMode === 'multiple' || selectionMode === 'range') {
            onDatesStringSelect?.(tempSelectedDates.map(toYmdLocal));
        } else if (tempSelectedDate) {
            onDateStringSelect?.(toYmdLocal(tempSelectedDate));
        }
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setTempSelectedDates(effectiveSelectedDates || []);
        setTempSelectedDate(effectiveSelectedDate);
        setIsModalOpen(false);
    };

    // Reset temp dates when modal opens
    React.useEffect(() => {
        if (isModalOpen) {
            if (selectionMode === 'multiple' || selectionMode === 'range') {
                setTempSelectedDates(effectiveSelectedDates || []);
            } else {
                setTempSelectedDate(effectiveSelectedDate);
            }
        }
    }, [isModalOpen, effectiveSelectedDate, effectiveSelectedDates, selectionMode]);

    const displayDate = () => {
        const dispDates = effectiveSelectedDates;
        const dispDate = effectiveSelectedDate;
        if (selectionMode === 'range' && dispDates && dispDates.length > 0) {
            if (dispDates.length === 1) {
                return formatDate(dispDates[0], dateFormat);
            }
            if (dispDates.length >= 2) {
                const start = dispDates[0];
                const end = dispDates[dispDates.length - 1];
                return `${formatDate(start, dateFormat)} - ${formatDate(end, dateFormat)}`;
            }
        }
        if (selectionMode === 'multiple' && dispDates && dispDates.length > 0) {
            if (dispDates.length === 1) {
                return formatDate(dispDates[0], dateFormat);
            } else {
                return `${dispDates.length} dates selected`;
            }
        } else if (dispDate) {
            return formatDate(dispDate, dateFormat);
        }
        return placeholder;
    };

    // If inline mode is requested, show the picker directly
    if (showInline) {
        return (
            <InlineDatePicker
                selectedDate={effectiveSelectedDate}
                selectedDates={effectiveSelectedDates}
                onDateStringSelect={onDateStringSelect}
                onDatesStringSelect={onDatesStringSelect}
                availableDates={availableDates}
                onMonthChange={onMonthChange}
                minDate={effectiveMinDate}
                maxDate={effectiveMaxDate}
                className={className}
                selectionMode={selectionMode}
                maxSelections={maxSelections}
                size={size}
                disabled={disabled}
                showTodayButton={showTodayButton}
            />
        );
    }

    // Modal mode (default)
    return (
        <>
            <Pressable
                className={cn(
                    'flex-row items-center justify-between h-10 px-3 py-2 border border-border-white rounded-sm',
                    disabled && 'opacity-50'
                )}
                disabled={disabled}
                onPress={() => setIsModalOpen(true)}
            >
                <View className="flex-row items-center gap-2">
                    <Text
                        className='leading-none'
                        style={{
                            color: (effectiveSelectedDate || (effectiveSelectedDates && effectiveSelectedDates.length > 0)) ? THEME.dark.foreground : THEME.dark.textSecondary,
                        }}
                    >
                        {displayDate()}
                    </Text>
                </View>
                {showCalendarIcon && (
                    <Image source={require('@/assets/images/icons/calendar_date.png')} style={{ width: 24, height: 24 }} />
                )}
            </Pressable>

            <Modal
                visible={isModalOpen}
                animationType="fade"
                transparent={true}
                onRequestClose={handleCancel}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                }}>
                    <View style={{
                        backgroundColor: THEME.dark.backgroundSecondary,
                        borderRadius: 12,
                        width: '100%',
                        maxWidth: 400,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: THEME.dark.border,
                        }}>
                            <Text variant="h4" style={{ color: THEME.dark.foreground }}>
                                {modalTitle}
                            </Text>
                            <Pressable
                                onPress={handleCancel}
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                }}
                            >
                                <Icon as={X} size={20} color={THEME.dark.textSecondary} />
                            </Pressable>
                        </View>

                        {/* Content */}
                        <View style={{ padding: 20 }}>
                            <NativeCalendarPicker
                                selectedDate={tempSelectedDate}
                                selectedDates={tempSelectedDates}
                                onDateSelect={handleDateSelect}
                                onDatesSelect={handleDatesSelect}
                                onDateStringSelect={onDateStringSelect}
                                onDatesStringSelect={onDatesStringSelect}
                                availableDates={availableDates}
                                onMonthChange={onMonthChange}
                                minDate={effectiveMinDate}
                                maxDate={effectiveMaxDate}
                                selectionMode={selectionMode}
                                maxSelections={maxSelections}
                                size={size}
                                showTodayButton={showTodayButton}
                            />
                        </View>

                        {/* Action Buttons */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                            gap: 12,
                            borderTopWidth: 1,
                            borderTopColor: THEME.dark.border,
                        }}>
                            <Button
                                variant="outline"
                                size="default"
                                onPress={handleCancel}
                                style={{ flex: 1 }}
                            >
                                <Text variant="h6">Cancel</Text>
                            </Button>
                            <Button
                                size="default"
                                onPress={handleConfirm}
                                style={{ flex: 1 }}
                            >
                                <Text variant="h6">Confirm</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

export { DatePicker, datePickerVariants };
