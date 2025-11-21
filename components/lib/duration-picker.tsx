import React, { useState, useRef, useMemo } from 'react';
import { View, Pressable, ScrollView, Modal } from 'react-native';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { THEME } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { ChevronDown, X } from 'lucide-react-native';


// Repeat duration picker variants
const durationPickerVariants = cva(
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

export interface DurationPickerProps {
    selectedDuration?: { value: number; unit: 'weeks' | 'months' | 'years' };
    onDurationSelect?: (duration: { value: number; unit: 'weeks' | 'months' | 'years' }) => void;
    disabled?: boolean;
    disabledUnits?: ('weeks' | 'months' | 'years')[];
    size?: 'small' | 'default' | 'large';
    className?: string;
    placeholder?: string;
    maxValue?: number; // Maximum number value (e.g., 52 for weeks, 12 for months, 10 for years)
    // Modal props
    showModal?: boolean;
    modalTitle?: string;
    // Inline picker props
    showInline?: boolean;
    height?: number;
    visibleItems?: number;
}

interface DurationItem {
    value: number;
    label: string;
    isSelected: boolean;
    isDisabled: boolean;
}

interface UnitItem {
    value: 'weeks' | 'months' | 'years';
    label: string;
    isSelected: boolean;
    isDisabled: boolean;
}

// Generate number options for scroll pickers
const generateNumberOptions = (max: number, interval: number = 1): DurationItem[] => {
    const options: DurationItem[] = [];

    for (let i = 1; i <= max; i += interval) {
        options.push({
            value: i,
            label: i.toString(),
            isSelected: false,
            isDisabled: false,
        });
    }

    return options;
};

// Generate unit options
const generateUnitOptions = (): UnitItem[] => {
    return [
        { value: 'weeks', label: 'Weeks', isSelected: false, isDisabled: false },
        { value: 'months', label: 'Months', isSelected: false, isDisabled: false },
        { value: 'years', label: 'Years', isSelected: false, isDisabled: false },
    ];
};

// Format duration for display
const formatDuration = (duration: { value: number; unit: 'weeks' | 'months' | 'years' }): string => {
    if (duration.value === 0) return '0';
    return `${duration.value} ${duration.unit}`;
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
    const centerPadding = (containerHeight / 2) - (itemHeight / 2);

    // Find current value index
    const currentIndex = options.findIndex(option => option.value === selectedValue);

    // Calculate initial scroll position (centered via padding)
    const initialScrollY = currentIndex >= 0
        ? Math.max(0, currentIndex * itemHeight)
        : 0;

    React.useEffect(() => {
        if (currentIndex >= 0 && scrollViewRef.current) {
            scrollViewRef.current?.scrollTo({
                y: initialScrollY,
                animated: false
            });
        }
    }, [currentIndex, initialScrollY]);

    const handleValueSelect = (value: number) => {
        onValueSelect(value);
    };

    const findNearestEnabledIndex = (fromIndex: number) => {
        if (fromIndex < 0 || fromIndex >= options.length) return -1;
        if (!options[fromIndex]?.isDisabled) return fromIndex;
        let offset = 1;
        while (fromIndex - offset >= 0 || fromIndex + offset < options.length) {
            if (fromIndex - offset >= 0 && !options[fromIndex - offset].isDisabled) return fromIndex - offset;
            if (fromIndex + offset < options.length && !options[fromIndex + offset].isDisabled) return fromIndex + offset;
            offset++;
        }
        return -1;
    };

    const handleMomentumScrollEnd = (e: any) => {
        const y = e?.nativeEvent?.contentOffset?.y ?? 0;
        let index = Math.round(y / itemHeight);
        index = Math.max(0, Math.min(index, options.length - 1));
        const enabledIndex = findNearestEnabledIndex(index);
        if (enabledIndex === -1) return;
        const value = options[enabledIndex].value;
        if (value !== selectedValue) {
            handleValueSelect(value);
        }
        if (enabledIndex !== index) {
            scrollViewRef.current?.scrollTo({ y: enabledIndex * itemHeight, animated: true });
        }
    };

    return (
        <View style={{ height: containerHeight, width: '100%' }}>
            {/* Center selection overlay */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: centerPadding,
                    left: 0,
                    right: 0,
                    height: itemHeight,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <View
                    style={{
                        width: 70,
                        height: itemHeight - 10,
                        borderRadius: 8,
                        backgroundColor: THEME.dark.backgroundTertiary,
                        borderWidth: 1,
                        borderColor: THEME.dark.border,
                    }}
                />
            </View>
            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    width: '100%',
                    paddingTop: centerPadding,
                    paddingBottom: centerPadding,
                }}
                snapToInterval={itemHeight}
                decelerationRate="fast"
                style={{ width: '100%' }}
                onMomentumScrollEnd={handleMomentumScrollEnd}
            >
                {options.map((option, index) => (
                    <View
                        key={option.value}
                        style={{
                            height: itemHeight,
                            width: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            opacity: option.isDisabled ? 0.3 : 1,
                        }}
                    >
                        <Text
                            variant="h6"
                            style={{
                                color: THEME.dark.textSecondary,
                                fontWeight: option.value === selectedValue ? '600' : '400',
                                fontSize: option.value === selectedValue ? 18 : 16,
                            }}
                        >
                            {option.label}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

// Individual scroll picker component for units
const UnitScrollPicker = ({
    options,
    selectedValue,
    onValueSelect,
    height,
    visibleItems,
}: {
    options: UnitItem[];
    selectedValue: 'weeks' | 'months' | 'years';
    onValueSelect: (value: 'weeks' | 'months' | 'years') => void;
    height: number;
    visibleItems: number;
}) => {
    return (
        <View style={{ height: '100%', width: '100%', justifyContent: 'center' }}>
            <View className='gap-2' style={{ width: '100%', alignItems: 'center' }}>
                {options.map(opt => (
                    <Pressable
                        key={opt.value}
                        disabled={opt.isDisabled}
                        onPress={() => onValueSelect(opt.value)}
                        style={{
                            height: 40,
                            minWidth: 100,
                            paddingHorizontal: 12,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 8,
                            backgroundColor: selectedValue === opt.value ? THEME.dark.backgroundTertiary : 'transparent',
                            borderWidth: 1,
                            borderColor: THEME.dark.border,
                            opacity: opt.isDisabled ? 0.3 : 1,
                        }}
                    >
                        <Text
                            style={{
                                color: selectedValue === opt.value ? THEME.dark.foreground : THEME.dark.textSecondary,
                                fontWeight: selectedValue === opt.value ? '600' : '400',
                            }}
                        >
                            {opt.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

// Native mobile repeat duration picker component with dual scroll for numbers and units
const NativeRepeatDurationPicker = ({
    selectedDuration,
    onDurationSelect,
    maxValue = 52,
    height = 140,
    visibleItems = 3,
    disabledUnits,
}: {
    selectedDuration?: { value: number; unit: 'weeks' | 'months' | 'years' };
    onDurationSelect?: (duration: { value: number; unit: 'weeks' | 'months' | 'years' }) => void;
    maxValue: number;
    height: number;
    visibleItems: number;
    disabledUnits?: ('weeks' | 'months' | 'years')[];
}) => {
    // Initialize state from selectedDuration prop
    const getInitialValues = () => {
        if (selectedDuration) {
            return { value: selectedDuration.value, unit: selectedDuration.unit };
        }
        return { value: 1, unit: 'weeks' as const };
    };

    const { value: initialValue, unit: initialUnit } = getInitialValues();
    const [selectedValue, setSelectedValue] = useState<number>(initialValue);
    const [selectedUnit, setSelectedUnit] = useState<'weeks' | 'months' | 'years'>(initialUnit);

    // Generate number and unit options
    const numberOptions = useMemo(() => {
        return generateNumberOptions(maxValue, 1);
    }, [maxValue]);

    const unitOptions = useMemo(() => {
        const opts = generateUnitOptions();
        if (disabledUnits && disabledUnits.length > 0) {
            return opts.map(o => ({ ...o, isDisabled: disabledUnits.includes(o.value) }));
        }
        return opts;
    }, [disabledUnits]);

    // Handle duration changes and notify parent
    const handleDurationChange = React.useCallback((newValue: number, newUnit: 'weeks' | 'months' | 'years') => {
        onDurationSelect?.({ value: newValue, unit: newUnit });
    }, [onDurationSelect]);

    // Update internal state when selectedDuration prop changes
    React.useEffect(() => {
        if (selectedDuration) {
            if (selectedDuration.value !== selectedValue) {
                setSelectedValue(selectedDuration.value);
            }
            if (selectedDuration.unit !== selectedUnit) {
                setSelectedUnit(selectedDuration.unit);
            }
        }
    }, [selectedDuration, selectedValue, selectedUnit]);

    // Handle value change
    const handleValueChange = React.useCallback((value: number) => {
        setSelectedValue(value);
        handleDurationChange(value, selectedUnit);
    }, [selectedUnit, handleDurationChange]);

    // Handle unit change
    const handleUnitChange = React.useCallback((unit: 'weeks' | 'months' | 'years') => {
        setSelectedUnit(unit);
        handleDurationChange(selectedValue, unit);
    }, [selectedValue, handleDurationChange]);

    // If current unit becomes disabled, switch to first enabled
    React.useEffect(() => {
        if (disabledUnits && disabledUnits.includes(selectedUnit)) {
            const candidates: Array<'weeks' | 'months' | 'years'> = ['weeks', 'months', 'years'];
            const fallback = candidates.find(u => !disabledUnits.includes(u));
            if (fallback && fallback !== selectedUnit) {
                setSelectedUnit(fallback);
                handleDurationChange(selectedValue, fallback);
            }
        }
    }, [disabledUnits, selectedUnit, selectedValue, handleDurationChange]);

    return (
        <View style={{ height, width: '100%' }}>
            <View style={{ flexDirection: 'row', height: '100%', alignItems: 'center', gap: 20 }}>
                {/* Number Picker */}
                <View style={{ flex: 1, height: '100%' }}>
                    <NumberScrollPicker
                        options={numberOptions}
                        selectedValue={selectedValue}
                        onValueSelect={handleValueChange}
                        height={height}
                        visibleItems={visibleItems}
                    />
                </View>

                {/* Unit Picker */}
                <View style={{ flex: 1, height: '100%' }}>
                    <UnitScrollPicker
                        options={unitOptions}
                        selectedValue={selectedUnit}
                        onValueSelect={handleUnitChange}
                        height={height}
                        visibleItems={visibleItems}
                    />
                </View>
            </View>
        </View>
    );
};

// Inline repeat duration picker component
const InlineRepeatDurationPicker = ({
    selectedDuration,
    onDurationSelect,
    maxValue = 52,
    height = 150,
    visibleItems = 3,
    className,
    disabledUnits,
}: {
    selectedDuration?: { value: number; unit: 'weeks' | 'months' | 'years' };
    onDurationSelect?: (duration: { value: number; unit: 'weeks' | 'months' | 'years' }) => void;
    maxValue: number;
    height: number;
    visibleItems: number;
    className?: string;
    disabledUnits?: ('weeks' | 'months' | 'years')[];
}) => {
    return (
        <View className={cn('w-full', className)}>
            <NativeRepeatDurationPicker
                selectedDuration={selectedDuration}
                onDurationSelect={onDurationSelect}
                maxValue={maxValue}
                height={height}
                visibleItems={visibleItems}
                disabledUnits={disabledUnits}
            />
        </View>
    );
};

function DurationPicker({
    selectedDuration,
    onDurationSelect,
    disabled = false,
    disabledUnits,
    size = 'default',
    className,
    placeholder = 'Select duration',
    maxValue = 52,
    showModal = true,
    modalTitle = 'Select Repeat Duration',
    showInline = false,
    height = 150,
    visibleItems = 3,
}: DurationPickerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempSelectedDuration, setTempSelectedDuration] = useState<{ value: number; unit: 'weeks' | 'months' | 'years' } | undefined>(selectedDuration ?? { value: 1, unit: 'weeks' as const });

    const handleDurationSelect = (duration: { value: number; unit: 'weeks' | 'months' | 'years' }) => {
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
            setTempSelectedDuration(selectedDuration ?? { value: 1, unit: 'weeks' as const });
        }
    }, [isModalOpen, selectedDuration]);

    const displayDuration = selectedDuration !== undefined
        ? formatDuration(selectedDuration)
        : placeholder;

    // If inline mode is requested, show the picker directly
    if (showInline) {
        return (
            <InlineRepeatDurationPicker
                selectedDuration={selectedDuration}
                onDurationSelect={handleDurationSelect}
                maxValue={maxValue}
                height={height}
                visibleItems={visibleItems}
                className={className}
                disabledUnits={disabledUnits}
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
                            <NativeRepeatDurationPicker
                                selectedDuration={tempSelectedDuration}
                                onDurationSelect={handleDurationSelect}
                                maxValue={maxValue}
                                height={height}
                                visibleItems={visibleItems}
                                disabledUnits={disabledUnits}
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

export { DurationPicker, durationPickerVariants };
