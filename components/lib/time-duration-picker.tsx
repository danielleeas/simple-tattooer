import React, { useState, useRef, useMemo } from 'react';
import { View, Pressable, ScrollView, Modal } from 'react-native';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { THEME } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { ChevronDown, X } from 'lucide-react-native';

// Time duration picker variants
const timeDurationPickerVariants = cva(
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

export interface TimeDurationPickerProps {
    selectedDuration?: number; // Duration in minutes
    onDurationSelect?: (duration: number) => void;
    minuteInterval?: 1 | 5 | 10 | 15 | 30;
    disabled?: boolean;
    size?: 'small' | 'default' | 'large';
    className?: string;
    placeholder?: string;
    minDuration?: number; // Minimum duration in minutes
    maxDuration?: number; // Maximum duration in minutes (e.g., 8 hours = 480 minutes)
    // Modal props
    showModal?: boolean;
    modalTitle?: string;
    // Inline picker props
    showInline?: boolean;
    height?: number;
    visibleItems?: number;
}

interface DurationItem {
    value: number; // Duration in minutes
    label: string;
    isSelected: boolean;
    isDisabled: boolean;
}

// Generate number options for scroll pickers
const generateNumberOptions = (max: number, interval: number = 1): DurationItem[] => {
    const options: DurationItem[] = [];

    for (let i = 0; i <= max; i += interval) {
        options.push({
            value: i,
            label: i.toString(),
            isSelected: false,
            isDisabled: false,
        });
    }

    return options;
};

// Format duration for display
const formatDuration = (duration: number): string => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    const parts: string[] = [];
    if (hours > 0) {
        parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }
    // Show minutes if there are any, or if duration is zero to avoid empty string
    if (minutes > 0 || parts.length === 0) {
        parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    }
    return parts.join(' ');
};

// Individual scroll picker component for numbers
const NumberScrollPicker = ({
    options,
    selectedValue,
    onValueSelect,
    height,
    visibleItems,
}: {
    options: DurationItem[];
    selectedValue: number;
    onValueSelect: (value: number) => void;
    height: number;
    visibleItems: number;
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const itemHeight = height / visibleItems;
    const containerHeight = height;
    const centerOffset = (containerHeight - itemHeight) / 2;

    // Find current value index
    const currentIndex = options.findIndex(option => option.value === selectedValue);

    // Calculate initial scroll position
    const initialScrollY = currentIndex >= 0
        ? currentIndex * itemHeight
        : 0;

    React.useEffect(() => {
        if (currentIndex >= 0 && scrollViewRef.current) {
            scrollViewRef.current?.scrollTo({
                y: initialScrollY,
                animated: false
            });
        }
    }, [currentIndex, initialScrollY]);

    // Handle scroll end to snap to center and select value
    const handleScrollEnd = (event: any) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        const index = Math.round(scrollY / itemHeight);
        const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
        
        // Scroll to the exact position to ensure perfect centering
        const targetScrollY = clampedIndex * itemHeight;
        scrollViewRef.current?.scrollTo({
            y: targetScrollY,
            animated: true
        });

        // Select the centered value
        const selectedOption = options[clampedIndex];
        if (selectedOption && !selectedOption.isDisabled) {
            onValueSelect(selectedOption.value);
        }
    };

    return (
        <View style={{ height: containerHeight, width: '100%', position: 'relative' }}>
            {/* Center indicator */}
            <View
                style={{
                    position: 'absolute',
                    top: centerOffset,
                    left: 0,
                    right: 0,
                    height: itemHeight,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    zIndex: 10,
                    pointerEvents: 'none',
                }}
            />
            
            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: centerOffset,
                    paddingBottom: centerOffset + (itemHeight * 2), // Extra padding to allow last item to center
                }}
                snapToInterval={itemHeight}
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={handleScrollEnd}
                style={{ flex: 1 }}
            >
                {options.map((option) => {
                    const isCenter = option.value === selectedValue;
                    return (
                        <View
                            key={option.value}
                            style={{
                                height: itemHeight,
                                width: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 10,
                            }}
                        >
                            <View
                                style={{
                                    width: 70,
                                    height: itemHeight - 10,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    opacity: option.isDisabled ? 0.3 : 1,
                                }}
                            >
                                <Text
                                    variant="h6"
                                    style={{
                                        color: isCenter
                                            ? THEME.dark.foreground
                                            : option.isDisabled
                                                ? THEME.dark.textSecondary
                                                : THEME.dark.textSecondary,
                                        fontWeight: isCenter ? '600' : '400',
                                        fontSize: isCenter ? 18 : 16,
                                    }}
                                >
                                    {option.label}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

// Native mobile duration picker component with dual scroll for hours and minutes
const NativeDurationPicker = ({
    selectedDuration,
    onDurationSelect,
    minuteInterval = 15,
    minDuration = 0,
    maxDuration = 480,
    height = 120,
    visibleItems = 3,
}: {
    selectedDuration?: number;
    onDurationSelect?: (duration: number) => void;
    minuteInterval: number;
    minDuration: number;
    maxDuration: number;
    height: number;
    visibleItems: number;
}) => {
    // Initialize state from selectedDuration prop
    const getInitialValues = () => {
        if (selectedDuration) {
            const hours = Math.floor(selectedDuration / 60);
            const minutes = Math.floor((selectedDuration % 60) / minuteInterval) * minuteInterval;
            return { hours, minutes };
        }
        return { hours: 0, minutes: 0 };
    };

    const { hours: initialHours, minutes: initialMinutes } = getInitialValues();
    const [selectedHours, setSelectedHours] = useState<number>(initialHours);
    const [selectedMinutes, setSelectedMinutes] = useState<number>(initialMinutes);

    // Generate hour and minute options
    const hourOptions = useMemo(() => {
        const maxHours = Math.floor(maxDuration / 60);
        // Include the max hour in the range
        return generateNumberOptions(maxHours, 1);
    }, [maxDuration]);

    const minuteOptions = useMemo(() => {
        return generateNumberOptions(59, minuteInterval);
    }, [minuteInterval]);

    // Handle duration changes and notify parent
    const handleDurationChange = React.useCallback((newHours: number, newMinutes: number) => {
        const totalMinutes = (newHours * 60) + newMinutes;
        if (totalMinutes >= minDuration && totalMinutes <= maxDuration) {
            onDurationSelect?.(totalMinutes);
        }
    }, [onDurationSelect, minDuration, maxDuration]);

    // Update internal state when selectedDuration prop changes
    React.useEffect(() => {
        if (selectedDuration !== undefined) {
            const hours = Math.floor(selectedDuration / 60);
            const minutes = Math.floor((selectedDuration % 60) / minuteInterval) * minuteInterval;
            
            if (hours !== selectedHours) {
                setSelectedHours(hours);
            }
            if (minutes !== selectedMinutes) {
                setSelectedMinutes(minutes);
            }
        }
    }, [selectedDuration, minuteInterval, selectedHours, selectedMinutes]);

    // Handle hour change
    const handleHourChange = React.useCallback((hour: number) => {
        setSelectedHours(hour);
        handleDurationChange(hour, selectedMinutes);
    }, [selectedMinutes, handleDurationChange]);

    // Handle minute change
    const handleMinuteChange = React.useCallback((minute: number) => {
        setSelectedMinutes(minute);
        handleDurationChange(selectedHours, minute);
    }, [selectedHours, handleDurationChange]);

    return (
        <View style={{ height, width: '100%' }}>
            <View style={{ flexDirection: 'row', height: '100%', alignItems: 'center' }}>
                {/* Hour Picker */}
                <View style={{ flex: 1, height: '100%' }}>
                    <NumberScrollPicker
                        options={hourOptions}
                        selectedValue={selectedHours}
                        onValueSelect={handleHourChange}
                        height={height}
                        visibleItems={visibleItems}
                    />
                </View>

                {/* Separator */}
                <View style={{ paddingHorizontal: 8, height: '100%', justifyContent: 'center' }}>
                    <Text variant="h4" style={{ color: THEME.dark.textSecondary }}>h</Text>
                </View>

                {/* Minute Picker */}
                <View style={{ flex: 1, height: '100%' }}>
                    <NumberScrollPicker
                        options={minuteOptions}
                        selectedValue={selectedMinutes}
                        onValueSelect={handleMinuteChange}
                        height={height}
                        visibleItems={visibleItems}
                    />
                </View>

                {/* Minute Label */}
                <View style={{ paddingHorizontal: 8, height: '100%', justifyContent: 'center' }}>
                    <Text variant="h4" style={{ color: THEME.dark.textSecondary }}>m</Text>
                </View>
            </View>
        </View>
    );
};

// Inline duration picker component
const InlineDurationPicker = ({
    selectedDuration,
    onDurationSelect,
    minuteInterval = 15,
    minDuration = 0,
    maxDuration = 480,
    height = 120,
    visibleItems = 3,
    className,
}: {
    selectedDuration?: number;
    onDurationSelect?: (duration: number) => void;
    minuteInterval: number;
    minDuration: number;
    maxDuration: number;
    height: number;
    visibleItems: number;
    className?: string;
}) => {
    return (
        <View className={cn('w-full', className)}>
            <NativeDurationPicker
                selectedDuration={selectedDuration}
                onDurationSelect={onDurationSelect}
                minuteInterval={minuteInterval}
                minDuration={minDuration}
                maxDuration={maxDuration}
                height={height}
                visibleItems={visibleItems}
            />
        </View>
    );
};

function TimeDurationPicker({
    selectedDuration,
    onDurationSelect,
    minuteInterval = 15,
    disabled = false,
    size = 'default',
    className,
    placeholder = 'Select duration',
    minDuration = 0,
    maxDuration = 480,
    showModal = true,
    modalTitle = 'Select Duration',
    showInline = false,
    height = 120,
    visibleItems = 3,
}: TimeDurationPickerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempSelectedDuration, setTempSelectedDuration] = useState<number | undefined>(selectedDuration);

    const handleDurationSelect = (duration: number) => {
        setTempSelectedDuration(duration);
    };

    const handleConfirm = () => {
        if (tempSelectedDuration !== undefined) {
            onDurationSelect?.(tempSelectedDuration);
        }
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setTempSelectedDuration(selectedDuration);
        setIsModalOpen(false);
    };

    // Reset temp duration when modal opens
    React.useEffect(() => {
        if (isModalOpen) {
            setTempSelectedDuration(selectedDuration);
        }
    }, [isModalOpen, selectedDuration]);

    const displayDuration = selectedDuration !== undefined
        ? formatDuration(selectedDuration)
        : placeholder;

    // If inline mode is requested, show the picker directly
    if (showInline) {
        return (
            <InlineDurationPicker
                selectedDuration={selectedDuration}
                onDurationSelect={handleDurationSelect}
                minuteInterval={minuteInterval}
                minDuration={minDuration}
                maxDuration={maxDuration}
                height={height}
                visibleItems={visibleItems}
                className={className}
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
                            color: selectedDuration !== undefined ? THEME.dark.foreground : THEME.dark.textSecondary,
                        }}
                    >
                        {displayDuration}
                    </Text>
                </View>
                <Icon as={ChevronDown} size={16} color={THEME.dark.textSecondary} />
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
                            <NativeDurationPicker
                                selectedDuration={tempSelectedDuration}
                                onDurationSelect={handleDurationSelect}
                                minuteInterval={minuteInterval}
                                minDuration={minDuration}
                                maxDuration={maxDuration}
                                height={height}
                                visibleItems={visibleItems}
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
                                variant="outline"
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

export { TimeDurationPicker, timeDurationPickerVariants };
