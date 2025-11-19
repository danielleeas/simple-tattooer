import { useMemo, useState } from "react";
import { View, Pressable, ScrollView, Dimensions } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type ViewMode = 'day' | 'week' | 'month';

const { width: screenWidth } = Dimensions.get('window');

interface CalendarDay {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
}

interface MultiDayEvent {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    startTime?: string;
    endTime?: string;
    color: string;
    type: string;
}

interface EventBar {
    event: MultiDayEvent;
    startDay: number;
    endDay: number;
    weekIndex: number;
    isFirstDay: boolean;
    isLastDay: boolean;
}

interface CalendarProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    selectedDate?: Date | null;
    onDateSelect?: (date: Date) => void;
    viewMode?: ViewMode;
    onViewModeChange?: (mode: ViewMode) => void;
    height?: number;
    events?: MultiDayEvent[];
}

export function Calendar({
    currentDate,
    onDateChange,
    selectedDate = null,
    onDateSelect,
    viewMode = 'month',
    onViewModeChange,
    height = 500,
    events = []
}: CalendarProps) {
    const [internalViewMode, setInternalViewMode] = useState<ViewMode>(viewMode);
    const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(selectedDate);

    const activeViewMode = onViewModeChange ? viewMode : internalViewMode;
    const activeSelectedDate = onDateSelect ? selectedDate : internalSelectedDate;

    const handlePreviousMonth = () => {
        if (activeViewMode === 'day') {
            const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
            onDateChange(newDate);
        } else if (activeViewMode === 'week') {
            const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
            onDateChange(newDate);
        } else {
            const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            onDateChange(newDate);
        }
    };

    const handleNextMonth = () => {
        if (activeViewMode === 'day') {
            const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
            onDateChange(newDate);
        } else if (activeViewMode === 'week') {
            const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7);
            onDateChange(newDate);
        } else {
            const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            onDateChange(newDate);
        }
    };

    const handleDateSelect = (date: Date) => {
        if (onDateSelect) {
            onDateSelect(date);
        } else {
            setInternalSelectedDate(date);
        }
    };

    const handleViewModeChange = (mode: ViewMode) => {
        if (onViewModeChange) {
            onViewModeChange(mode);
        } else {
            setInternalViewMode(mode);
        }
        
        if (mode === 'day' && activeSelectedDate) {
            onDateChange(activeSelectedDate);
        }
    };

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    // Helper function to check if a date falls within a multi-day event
    const isDateInMultiDayEvent = (date: Date, event: MultiDayEvent) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return date >= eventStart && date <= eventEnd;
    };

    // Get multi-day events for a specific date
    const getMultiDayEventsForDate = (date: Date) => {
        return events.filter(event => isDateInMultiDayEvent(date, event));
    };

    // Get events for a specific day with time information
    const getDayEventsWithTime = (date: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.startDate);
            return isSameDay(eventDate, date) && event.startTime;
        });
    };

    // Convert time string to hour for positioning
    const timeToHour = (timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours + minutes / 60;
    };

    // Get events for a specific time slot
    const getEventsForTimeSlot = (date: Date, hour: number) => {
        return getDayEventsWithTime(date).filter(event => {
            if (!event.startTime) return false;
            const eventStartHour = timeToHour(event.startTime);
            let eventEndHour = timeToHour(event.startTime);
            if (event.endTime) eventEndHour = timeToHour(event.endTime);
            return Math.floor(eventStartHour) <= hour && Math.floor(eventEndHour) > hour;
        });
    };

    // Generate event bars for multi-day events in the current month view
    const generateEventBars = useMemo(() => {
        const eventBars: EventBar[] = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Get the first day of the month and calculate the calendar grid
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDayOfWeek);

        events.forEach(event => {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);

            // Check if event overlaps with current month view
            const viewStart = new Date(startDate);
            const viewEnd = new Date(startDate);
            viewEnd.setDate(viewEnd.getDate() + 41); // 6 weeks * 7 days - 1

            if (eventEnd >= viewStart && eventStart <= viewEnd) {
                // Calculate which days the event spans in the calendar grid
                const actualStart = eventStart > viewStart ? eventStart : viewStart;
                const actualEnd = eventEnd < viewEnd ? eventEnd : viewEnd;

                const startDayIndex = Math.floor((actualStart.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));
                const endDayIndex = Math.floor((actualEnd.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));

                // Calculate week and day positions
                const startWeek = Math.floor(startDayIndex / 7);
                const startDay = startDayIndex % 7;
                const endWeek = Math.floor(endDayIndex / 7);
                const endDay = endDayIndex % 7;

                // If event spans multiple weeks, create separate bars for each week
                for (let week = startWeek; week <= endWeek; week++) {
                    const weekStartDay = week === startWeek ? startDay : 0;
                    const weekEndDay = week === endWeek ? endDay : 6;

                    eventBars.push({
                        event,
                        startDay: weekStartDay,
                        endDay: weekEndDay,
                        weekIndex: week,
                        isFirstDay: week === startWeek,
                        isLastDay: week === endWeek
                    });
                }
            }
        });

        return eventBars;
    }, [currentDate]);

    // Get events for a specific day and week
    const getEventsForDay = (weekIndex: number, dayIndex: number) => {
        return generateEventBars.filter(bar =>
            bar.weekIndex === weekIndex &&
            dayIndex >= bar.startDay &&
            dayIndex <= bar.endDay
        );
    };

    // Get color class for event
    const getEventColorClass = (color: string) => {
        switch (color) {
            case 'blue':
                return 'bg-blue-500';
            case 'green':
                return 'bg-green';
            case 'orange':
                return 'bg-orange-500';
            case 'purple':
                return 'bg-purple';
            default:
                return 'bg-primary';
        }
    };

    // Generate time slots for day view (9am to 7pm like in the image)
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 0; hour <= 23; hour++) {
            let timeString;
            if (hour < 12) {
                timeString = `${hour}am`;
            } else if (hour === 12) {
                timeString = '12pm';
            } else {
                const displayHour = hour - 12;
                timeString = `${displayHour.toString().padStart(2, '0')}pm`;
            }

            slots.push({
                hour,
                timeString
            });
        }
        return slots;
    }, [currentDate]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate week days for week view
    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day; // Sunday
        startOfWeek.setDate(diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push({
                date,
                dayName: dayNames[i],
                dayNumber: date.getDate(),
                isToday: isSameDay(date, new Date())
            });
        }
        return days;
    }, [currentDate]);

    // Generate time slots for week view (9am to 7pm)
    const weekTimeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 0; hour <= 23; hour++) {
            let timeString;
            if (hour < 12) {
                timeString = `${hour}am`;
            } else if (hour === 12) {
                timeString = '12pm';
            } else {
                timeString = `${hour - 12}pm`;
            }

            slots.push({
                hour,
                timeString
            });
        }
        return slots;
    }, []);

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = new Date();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay();

        const days: CalendarDay[] = [];

        // Helper function to check if date is selected
        const isDateSelected = (date: Date) => {
            return activeSelectedDate ? isSameDay(date, activeSelectedDate) : false;
        };

        // Calculate the start date for the calendar grid (first Sunday of the calendar view)
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDayOfWeek);

        // Generate 42 days (6 weeks) starting from the calculated start date
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const isCurrentMonth = date.getMonth() === month;
            const isToday = isSameDay(date, today);
            const isSelected = isDateSelected(date);

            days.push({
                date,
                day: date.getDate(),
                isCurrentMonth,
                isToday,
                isSelected
            });
        }

        return days;
    }, [currentDate, activeSelectedDate]);

    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const selectedDayMultiDayEvents = activeSelectedDate ? getMultiDayEventsForDate(activeSelectedDate) : [];

    return (
        <View className="w-full gap-4" style={{ height }}>
            {/* Calendar Header */}
            <View className="flex-row items-center justify-between">
                <Pressable onPress={handlePreviousMonth}>
                    <Icon as={ChevronLeft} strokeWidth={1} size={24} />
                </Pressable>

                <Pressable
                    onPress={() => handleViewModeChange('day')}
                    style={{ width: 72, height: 28 }}
                    className={`items-center justify-center rounded-full border ${activeViewMode === 'day'
                        ? 'bg-foreground border-foreground'
                        : 'border-border-secondary'
                        }`}
                >
                    <Text className={`text-xs ${activeViewMode === 'day'
                        ? 'text-background'
                        : 'text-foreground'
                        }`}>Day</Text>
                </Pressable>
                <Pressable onPress={() => handleViewModeChange('month')}>
                    <Text className="text-2xl text-foreground" style={{ height: 28, lineHeight: 28 }}>
                        {activeViewMode === 'week'
                            ? `${monthNames[weekDays[0].date.getMonth()]} ${weekDays[0].date.getFullYear()}`
                            : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        }
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => handleViewModeChange('week')}
                    style={{ width: 72, height: 28 }}
                    className={`items-center justify-center rounded-full border ${activeViewMode === 'week'
                        ? 'bg-foreground border-foreground'
                        : 'border-border-secondary'
                        }`}
                >
                    <Text className={`text-xs ${activeViewMode === 'week'
                        ? 'text-background'
                        : 'text-foreground'
                        }`}>Week</Text>
                </Pressable>

                <Pressable onPress={handleNextMonth}>
                    <Icon as={ChevronRight} strokeWidth={1} size={24} />
                </Pressable>
            </View>

            <View className="flex-1">
                {activeViewMode === 'day' ? (
                    /* Day View */
                    <View className="flex-1 border border-border-secondary">
                        {/* Day Header */}
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

                        {/* Time Slots */}
                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                            <View className="relative">
                                {/* Time slots grid */}
                                {timeSlots.map((slot, index) => (
                                    <View key={index} className="flex-row border-b border-border-secondary" style={{ height: 40 }}>
                                        <View className="w-20 justify-center items-center border-r border-border-secondary py-2">
                                            <Text className="text-xs">
                                                {slot.timeString}
                                            </Text>
                                        </View>
                                        <View className="flex-1 justify-center items-center py-2 relative">
                                            {/* Empty space for events to be positioned over */}
                                        </View>
                                    </View>
                                ))}
                                
                                {/* Events positioned absolutely over the time grid */}
                                {getDayEventsWithTime(currentDate).map((event, eventIndex) => {
                                    if (!event.startTime) return null;
                                    
                                    const eventStartTime = timeToHour(event.startTime);
                                    const eventEndTime = event.endTime ? timeToHour(event.endTime) : eventStartTime + 1;
                                    const eventDuration = eventEndTime - eventStartTime;
                                    
                                    // Calculate position and height
                                    const topPosition = eventStartTime * 40; // 40px per hour
                                    const eventHeight = eventDuration * 40; // 40px per hour
                                    const leftPosition = (eventIndex + 1) * 45 + 40;
                                    
                                    return (
                                        <View
                                            key={event.id}
                                            className={`${getEventColorClass(event.color)} rounded-sm px-1 py-1`}
                                            style={{
                                                width: 40,
                                                position: 'absolute',
                                                left: leftPosition,
                                                top: topPosition,
                                                height: eventHeight,
                                                zIndex: 1,
                                                borderTopLeftRadius: 4,
                                                borderTopRightRadius: 4,
                                                borderBottomRightRadius: 4,
                                                borderBottomLeftRadius: 4,
                                            }}
                                        >
                                            <Text
                                                className="text-white text-xs font-medium text-center"
                                                numberOfLines={1}
                                                style={{
                                                    fontSize: 10,
                                                    textShadowColor: 'rgba(0,0,0,0.5)',
                                                    textShadowOffset: { width: 0, height: 1 },
                                                    textShadowRadius: 1
                                                }}
                                            >
                                                {event.name}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                ) : activeViewMode === 'week' ? (
                    /* Week View */
                    <View className="flex-1 border border-border-secondary">
                        {/* Week Header */}
                        <View className="flex-row border-b border-border-secondary">
                            <View className="w-10 h-10 justify-center items-center border-r border-border-secondary">
                            </View>
                            {weekDays.map((day, index) => (
                                <View key={index} className="flex-1 h-10 justify-center items-center border-r border-border-secondary" style={index === 6 ? { borderRightWidth: 0 } : {}}>
                                    <Text className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                                        {day.dayName}
                                    </Text>
                                    <Text className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                                        {day.dayNumber}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Week Time Slots */}
                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                            <View className="relative">
                                {/* Time slots grid */}
                                {weekTimeSlots.map((slot, index) => (
                                    <View key={index} className="flex-row border-b border-border-secondary" style={{ height: 40 }}>
                                        <View className="w-10 justify-center items-center border-r border-border-secondary py-2">
                                            <Text className="text-xs">
                                                {slot.timeString}
                                            </Text>
                                        </View>
                                        {weekDays.map((day, dayIndex) => (
                                            <View key={dayIndex} className="flex-1 justify-center items-center py-2 border-r border-border-secondary relative" style={dayIndex === 6 ? { borderRightWidth: 0 } : {}}>
                                                {/* Empty space for events to be positioned over */}
                                            </View>
                                        ))}
                                    </View>
                                ))}
                                
                                {/* Events positioned absolutely over the week time grid */}
                                {weekDays.map((day, dayIndex) => {
                                    const dayEvents = getDayEventsWithTime(day.date);
                                    return dayEvents.map((event, eventIndex) => {
                                        if (!event.startTime) return null;
                                        
                                        const eventStartTime = timeToHour(event.startTime);
                                        const eventEndTime = event.endTime ? timeToHour(event.endTime) : eventStartTime + 1;
                                        const eventDuration = eventEndTime - eventStartTime;
                                        
                                        // Calculate position and height
                                        const topPosition = eventStartTime * 40+2; // 40px per hour
                                        const eventHeight = eventDuration * 40-2; // 40px per hour
                                        const dayViewWidth = (screenWidth - 72)/7;
                                        const leftPosition = 40 + (dayIndex * dayViewWidth) + 2*(eventIndex+1); // 10px for time column + day width + margin
                                        const eventWidth = dayViewWidth-(2*(eventIndex+1)); // Day width minus margins
                                        
                                        return (
                                            <View
                                                key={`${event.id}-${dayIndex}`}
                                                className={`${getEventColorClass(event.color)} px-1 py-1`}
                                                style={{
                                                    width: eventWidth,
                                                    position: 'absolute',
                                                    left: leftPosition,
                                                    top: topPosition,
                                                    height: eventHeight,
                                                    zIndex: 1,
                                                    borderRadius: 4,
                                                }}
                                            >
                                                <Text
                                                    className="text-white text-xs font-medium text-center"
                                                    numberOfLines={1}
                                                    style={{
                                                        fontSize: 10,
                                                        textShadowColor: 'rgba(0,0,0,0.5)',
                                                        textShadowOffset: { width: 0, height: 1 },
                                                        textShadowRadius: 1
                                                    }}
                                                >
                                                    {event.name}
                                                </Text>
                                            </View>
                                        );
                                    });
                                }).flat()}
                            </View>
                        </ScrollView>
                    </View>
                ) : (
                    /* Month View */
                    <>
                        {/* Day Names Header */}
                        <View className="flex-row border border-border-secondary">
                            {dayNames.map((dayName, index) => (
                                <View key={index} className="flex-1 h-10 justify-center items-center py-2 border-r border-border-secondary" style={index == 6 ? { borderRightWidth: 0 } : {}}>
                                    <Text variant="p" className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                                        {dayName}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Calendar Grid */}
                        <View className="flex-1">
                            {Array.from({ length: 6 }, (_, weekIndex) => (
                                <View key={weekIndex} className="flex-row flex-1 border-border-secondary" style={{ borderLeftWidth: 1 }}>
                                    {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                                        <Pressable
                                            key={`${weekIndex}-${dayIndex}`}
                                            onPress={() => handleDateSelect(day.date)}
                                            className='flex-1 items-center pt-2 justify-start border-border-secondary border-r border-b relative'
                                        >
                                            <View
                                                className="rounded-full relative items-center justify-center"
                                            >
                                                <Text
                                                    className="text-xs"
                                                    style={!day.isCurrentMonth ? { opacity: 0.5 } : {}}
                                                >
                                                    {day.date.getDate()}
                                                </Text>
                                            </View>

                                            {/* Event bars for this day */}
                                            <View className="absolute left-0 right-0" style={{ top: 25 }}>
                                                {(() => {
                                                    const eventsForDay = getEventsForDay(weekIndex, dayIndex);
                                                    const maxVisibleEvents = 2;
                                                    const visibleEvents = eventsForDay.slice(0, maxVisibleEvents);
                                                    const hasMoreEvents = eventsForDay.length > maxVisibleEvents;

                                                    return (
                                                        <>
                                                            {visibleEvents.map((bar, eventIndex) => {
                                                                const isStartDay = dayIndex === bar.startDay && bar.isFirstDay;
                                                                const isEndDay = dayIndex === bar.endDay && bar.isLastDay;

                                                                return (
                                                                    <View
                                                                        key={`${bar.event.id}-${weekIndex}-${dayIndex}`}
                                                                        className={`h-3 ${getEventColorClass(bar.event.color)}`}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: eventIndex * 15,
                                                                            left: isStartDay ? 2 : -1,
                                                                            right: isEndDay ? 2 : -1,
                                                                            borderTopLeftRadius: isStartDay ? 4 : 0,
                                                                            borderBottomLeftRadius: isStartDay ? 4 : 0,
                                                                            borderTopRightRadius: isEndDay ? 4 : 0,
                                                                            borderBottomRightRadius: isEndDay ? 4 : 0,
                                                                            zIndex: 1,
                                                                            marginBottom: 2,
                                                                        }}
                                                                    >
                                                                        {isStartDay && (
                                                                            <Text
                                                                                className="text-white text-xs px-1 font-medium"
                                                                                numberOfLines={1}
                                                                                style={{
                                                                                    fontSize: 10,
                                                                                    lineHeight: 12,
                                                                                    textShadowColor: 'rgba(0,0,0,0.5)',
                                                                                    textShadowOffset: { width: 0, height: 1 },
                                                                                    textShadowRadius: 1
                                                                                }}
                                                                            >
                                                                                {bar.event.name}
                                                                            </Text>
                                                                        )}
                                                                    </View>
                                                                );
                                                            })}

                                                            {/* More button when there are more than 3 events */}
                                                            {hasMoreEvents && (
                                                                <Pressable
                                                                    className="h-3 bg-muted rounded"
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: maxVisibleEvents * 15,
                                                                        left: 2,
                                                                        right: 2,
                                                                        zIndex: 1
                                                                    }}
                                                                    onPress={() => {
                                                                        // Handle more button click - could show a modal or navigate to day view
                                                                        handleDateSelect(day.date);
                                                                    }}
                                                                >
                                                                    <Text
                                                                        className="text-white text-xs px-1 font-medium text-center"
                                                                        numberOfLines={1}
                                                                        style={{
                                                                            fontSize: 10,
                                                                            lineHeight: 12,
                                                                            textShadowColor: 'rgba(0,0,0,0.5)',
                                                                            textShadowOffset: { width: 0, height: 1 },
                                                                            textShadowRadius: 1
                                                                        }}
                                                                    >
                                                                        +{eventsForDay.length - maxVisibleEvents} more
                                                                    </Text>
                                                                </Pressable>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </View>
                                        </Pressable>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </View>
        </View>
    );
}
