import React, { useState, useRef, useMemo } from 'react';
import { View, Pressable, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/utils';
import { THEME } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { ChevronDown, X } from 'lucide-react-native';

export interface DurationPickerProps {
    selectedDuration?: { value: number; unit: 'days' | 'weeks' | 'months' | 'years' };
    onDurationSelect?: (duration: { value: number; unit: 'days' | 'weeks' | 'months' | 'years' }) => void;
    disabled?: boolean;
    disabledUnits?: ('days' | 'weeks' | 'months' | 'years')[];
    className?: string;
    placeholder?: string;
    maxValue?: number;
    modalTitle?: string;
    height?: number;
    visibleItems?: number;
}

interface NumberItem {
    value: number;
    label: string;
    isDisabled: boolean;
}

interface UnitItem {
    value: 'days' | 'weeks' | 'months' | 'years';
    label: string;
    isDisabled: boolean;
}

const formatDuration = (duration: { value: number; unit: 'days' | 'weeks' | 'months' | 'years' }): string => {
    if (duration.value === 0) return '0';
    return `${duration.value} ${duration.unit}`;
};

// Number scroll picker with infinite loop
const REPEAT_COUNT = 3; // Number of times to repeat the options

const NumberPicker = ({
    options,
    selectedValue,
    onValueSelect,
    height,
    visibleItems,
}: {
    options: NumberItem[];
    selectedValue: number;
    onValueSelect: (value: number) => void;
    height: number;
    visibleItems: number;
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const itemHeight = height / visibleItems;
    const centerPadding = (height / 2) - (itemHeight / 2);
    const optionsLength = options.length;
    
    // Create repeated options for infinite scroll effect
    const repeatedOptions = useMemo(() => {
        const repeated: (NumberItem & { key: string })[] = [];
        for (let i = 0; i < REPEAT_COUNT; i++) {
            options.forEach((option, idx) => {
                repeated.push({ ...option, key: `${i}-${idx}` });
            });
        }
        return repeated;
    }, [options]);

    // Start in the middle set
    const middleSetOffset = optionsLength;
    const currentIndex = options.findIndex(option => option.value === selectedValue);

    React.useEffect(() => {
        if (currentIndex >= 0 && scrollViewRef.current) {
            scrollViewRef.current?.scrollTo({
                y: (middleSetOffset + currentIndex) * itemHeight,
                animated: false
            });
        }
    }, [currentIndex, itemHeight, middleSetOffset]);

    const findNearestEnabledIndex = (fromIndex: number) => {
        const normalizedIndex = fromIndex % optionsLength;
        if (!options[normalizedIndex]?.isDisabled) return normalizedIndex;
        let offset = 1;
        while (offset < optionsLength) {
            const prev = (normalizedIndex - offset + optionsLength) % optionsLength;
            const next = (normalizedIndex + offset) % optionsLength;
            if (!options[prev].isDisabled) return prev;
            if (!options[next].isDisabled) return next;
            offset++;
        }
        return -1;
    };

    const handleScroll = (e: any) => {
        const y = e?.nativeEvent?.contentOffset?.y ?? 0;
        const totalHeight = optionsLength * itemHeight;
        
        // Reset to middle when scrolling too far
        if (y < totalHeight * 0.5) {
            scrollViewRef.current?.scrollTo({ y: y + totalHeight, animated: false });
        } else if (y > totalHeight * 1.5) {
            scrollViewRef.current?.scrollTo({ y: y - totalHeight, animated: false });
        }
    };

    const handleMomentumScrollEnd = (e: any) => {
        const y = e?.nativeEvent?.contentOffset?.y ?? 0;
        let index = Math.round(y / itemHeight) % optionsLength;
        if (index < 0) index += optionsLength;
        
        const enabledIndex = findNearestEnabledIndex(index);
        if (enabledIndex === -1) return;
        
        const value = options[enabledIndex].value;
        if (value !== selectedValue) {
            onValueSelect(value);
        }
    };

    return (
        <View style={{ height, width: '100%' }}>
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
                    zIndex: -1,
                }}
            >
                <View
                    style={{
                        width: '80%',
                        height: itemHeight - 10,
                        backgroundColor: THEME.dark.backgroundTertiary,
                        borderWidth: 1,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
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
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleMomentumScrollEnd}
            >
                {repeatedOptions.map((option) => (
                    <View
                        key={option.key}
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
                            variant="h5"
                            style={{
                                color: THEME.dark.textSecondary,
                                fontWeight: option.value === selectedValue ? '800' : '400',
                                fontSize: option.value === selectedValue ? 20 : 16,
                            }}
                        >
                            {option.label}
                        </Text>
                    </View>
                ))}
            </ScrollView>
            <LinearGradient
                colors={[THEME.dark.backgroundSecondary, 'transparent', 'transparent', THEME.dark.backgroundSecondary]}
                locations={[0, 0.4, 0.6, 1]}
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
            />
        </View>
    );
};

// Unit picker
const UnitPicker = ({
    options,
    selectedValue,
    onValueSelect,
}: {
    options: UnitItem[];
    selectedValue: 'days' | 'weeks' | 'months' | 'years';
    onValueSelect: (value: 'days' | 'weeks' | 'months' | 'years') => void;
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
                            paddingVertical: 4,
                            minWidth: 100,
                            paddingHorizontal: 12,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 4,
                            backgroundColor: selectedValue === opt.value ? THEME.dark.backgroundTertiary : 'transparent',
                            borderWidth: 1,
                            borderColor: THEME.dark.border,
                            opacity: opt.isDisabled ? 0.3 : 1,
                        }}
                    >
                        <Text
                            className='text-center text-sm'
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

function DurationPicker({
    selectedDuration,
    onDurationSelect,
    disabled = false,
    disabledUnits,
    className,
    placeholder = 'Select duration',
    maxValue = 52,
    modalTitle = 'Select Repeat Duration',
    height = 180,
    visibleItems = 3,
}: DurationPickerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempValue, setTempValue] = useState<number>(selectedDuration?.value ?? 1);
    const [tempUnit, setTempUnit] = useState<'days' | 'weeks' | 'months' | 'years'>(selectedDuration?.unit ?? 'days');

    const numberOptions = useMemo((): NumberItem[] => {
        return Array.from({ length: maxValue }, (_, i) => ({
            value: i + 1,
            label: (i + 1).toString(),
            isDisabled: false,
        }));
    }, [maxValue]);

    const unitOptions = useMemo((): UnitItem[] => {
        return [
            { value: 'days', label: 'Days', isDisabled: disabledUnits?.includes('days') ?? false },
            { value: 'weeks', label: 'Weeks', isDisabled: disabledUnits?.includes('weeks') ?? false },
            { value: 'months', label: 'Months', isDisabled: disabledUnits?.includes('months') ?? false },
            { value: 'years', label: 'Years', isDisabled: disabledUnits?.includes('years') ?? false },
        ];
    }, [disabledUnits]);

    const handleConfirm = () => {
        onDurationSelect?.({ value: tempValue, unit: tempUnit });
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setTempValue(selectedDuration?.value ?? 1);
        setTempUnit(selectedDuration?.unit ?? 'days');
        setIsModalOpen(false);
    };

    React.useEffect(() => {
        if (isModalOpen) {
            setTempValue(selectedDuration?.value ?? 1);
            setTempUnit(selectedDuration?.unit ?? 'days');
        }
    }, [isModalOpen, selectedDuration]);

    // Switch to enabled unit if current is disabled
    React.useEffect(() => {
        if (disabledUnits?.includes(tempUnit)) {
            const fallback = unitOptions.find(u => !u.isDisabled);
            if (fallback) setTempUnit(fallback.value);
        }
    }, [disabledUnits, tempUnit, unitOptions]);

    const displayDuration = selectedDuration ? formatDuration(selectedDuration) : placeholder;

    return (
        <>
            <Pressable
                className={cn(
                    'flex-row items-center justify-between h-10 px-3 py-2 border border-border-white rounded-sm',
                    disabled && 'opacity-50',
                    className
                )}
                disabled={disabled}
                onPress={() => setIsModalOpen(true)}
            >
                <View className="flex-row items-center gap-2">
                    <Text
                        className='leading-none'
                        style={{
                            color: selectedDuration ? THEME.dark.foreground : THEME.dark.textSecondary,
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
                    <Pressable onPress={handleCancel} style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    <View style={{
                        backgroundColor: THEME.dark.backgroundSecondary,
                        borderRadius: 12,
                        width: '100%',
                        maxWidth: 400,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
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
                            <Pressable onPress={handleCancel} style={{ padding: 8, borderRadius: 8 }}>
                                <Icon as={X} size={20} color={THEME.dark.textSecondary} />
                            </Pressable>
                        </View>

                        {/* Content */}
                        <View style={{ height, padding: 15 }}>
                            <View style={{ flexDirection: 'row', height: '100%', alignItems: 'center', gap: 20 }}>
                                <View style={{ flex: 1, height: '100%' }}>
                                    <NumberPicker
                                        options={numberOptions}
                                        selectedValue={tempValue}
                                        onValueSelect={setTempValue}
                                        height={height-30}
                                        visibleItems={visibleItems}
                                    />
                                </View>
                                <View style={{ flex: 1, height: '100%' }}>
                                    <UnitPicker
                                        options={unitOptions}
                                        selectedValue={tempUnit}
                                        onValueSelect={setTempUnit}
                                    />
                                </View>
                            </View>
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
                            <Button variant="outline" size="default" onPress={handleCancel} style={{ flex: 1 }}>
                                <Text variant="h6">Cancel</Text>
                            </Button>
                            <Button variant="outline" size="default" onPress={handleConfirm} style={{ flex: 1 }}>
                                <Text variant="h6">Confirm</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

export { DurationPicker };
