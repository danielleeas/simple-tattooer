import React, { useMemo, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { TimerPicker } from "react-native-timer-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { ChevronDown, X } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { THEME } from "@/lib/theme";
import { Button } from "@/components/ui/button";

type Duration = {
    hours?: number;
    minutes?: number;
    seconds?: number;
};

export type TimePickerProps = {
    selectedTime?: Date;
    onTimeSelect?: (time: Date) => void;
    placeholder?: string;
    modalTitle?: string;
    use12Hour?: boolean;
    minuteInterval?: number;
    disabled?: boolean;
    amLabel?: string;
    pmLabel?: string;
    className?: string;
    initialTime?: Date;
};

function pad2(n?: number) {
    return (n ?? 0).toString().padStart(2, "0");
}

function formatDateDisplay(time?: Date, use12Hour?: boolean) {
    if (!time) return "";
    const hours = time.getHours();
    const minutes = time.getMinutes();
    if (use12Hour) {
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours < 12 ? "AM" : "PM";
        return `${pad2(displayHour)}:${pad2(minutes)} ${ampm}`;
    }
    return `${pad2(hours)}:${pad2(minutes)}`;
}

export const TimePicker = ({
    selectedTime,
    onTimeSelect,
    placeholder = "Set time",
    modalTitle = "Select Time",
    use12Hour = true,
    minuteInterval = 1,
    disabled = false,
    amLabel = "AM",
    pmLabel = "PM",
    className,
    initialTime,
}: TimePickerProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [localSelectedTime, setLocalSelectedTime] = useState<Date | undefined>(selectedTime ?? initialTime);
    const [tempDuration, setTempDuration] = useState<Duration | undefined>(undefined);

    React.useEffect(() => {
        if (selectedTime !== undefined) {
            setLocalSelectedTime(selectedTime);
            return;
        }
        setLocalSelectedTime(initialTime);
    }, [selectedTime, initialTime]);

    const display = useMemo(() => {
        const toFormat = localSelectedTime ?? selectedTime ?? initialTime;
        const str = formatDateDisplay(toFormat, use12Hour);
        return str.length ? str : placeholder;
    }, [localSelectedTime, selectedTime, initialTime, placeholder, use12Hour]);

    const initialDuration = useMemo<Duration | undefined>(() => {
        const source = localSelectedTime ?? selectedTime ?? initialTime;
        if (!source) return undefined;
        const hours = source.getHours();
        const minutes = Math.floor(source.getMinutes() / (minuteInterval || 1)) * (minuteInterval || 1);
        return { hours, minutes, seconds: 0 };
    }, [localSelectedTime, selectedTime, initialTime, minuteInterval]);

    React.useEffect(() => {
        if (isVisible) {
            setTempDuration(initialDuration);
        }
    }, [isVisible, initialDuration]);

    return (
        <>

            <Pressable
                className={cn(
                    'flex-row items-center justify-between h-10 px-3 py-2 border border-border-white rounded-sm',
                    disabled && 'opacity-50'
                )}
                disabled={disabled}
                onPress={() => setIsVisible(true)}
            >
                <View className="flex-row items-center gap-2">
                    <Text
                        className='leading-none'
                        style={{
                            color: display === placeholder ? THEME.dark.textSecondary : THEME.dark.foreground,
                        }}
                    >
                        {display}
                    </Text>
                </View>
                <Icon as={ChevronDown} size={16} color={THEME.dark.textSecondary} />
            </Pressable>

            <Modal
                visible={isVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setIsVisible(false)}
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
                                onPress={() => setIsVisible(false)}
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                }}
                            >
                                <Icon as={X} size={20} color={THEME.dark.textSecondary} />
                            </Pressable>
                        </View>

                        {/* Picker */}
                        <View
                            className="relative"
                            style={{ alignItems: "center", justifyContent: "center" }}>
                            <View
                                className="absolute left-0 right-0 flex-row items-center justify-center"
                                style={{
                                    height: 50,
                                    top: 50,
                                    paddingVertical: 4,
                                }}
                            >
                                <View style={{ width: 150, borderRadius: 5, height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', }} />
                                <View style={{ paddingHorizontal: 8, height: '100%', justifyContent: 'center' }}>
                                    <Text variant="h4" style={{ color: THEME.dark.textSecondary }}>:</Text>
                                </View>
                                <View style={{ width: 150, borderRadius: 5, height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', }} />
                            </View>
                            <TimerPicker
                                onDurationChange={(d) => {
                                    setTempDuration(d);
                                }}
                                initialValue={initialDuration}
                                hideDays
                                hideSeconds
                                padWithNItems={1}
                                minuteLabel="Min"
                                secondsPickerIsDisabled
                                use12HourPicker={use12Hour}
                                minuteInterval={minuteInterval}
                                amLabel={amLabel}
                                pmLabel={pmLabel}
                                padMinutesWithZero
                                padHoursWithZero
                                LinearGradient={LinearGradient}
                                styles={{
                                    theme: "dark",
                                    text: {
                                        fontSize: 20,
                                    },
                                    pickerContainer: {
                                        marginRight: '10%',
                                        backgroundColor: 'transparent',
                                        alignItems: "center",
                                        justifyContent: "center",
                                    },
                                    pickerLabel: {
                                        right: -20,
                                        fontSize: 16,
                                    },
                                    pickerLabelContainer: {
                                        width: 60,
                                    },
                                    pickerItemContainer: {
                                        width: 150,
                                        height: 50,
                                        backgroundColor: 'transparent',
                                    },
                                }}
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
                                onPress={() => setIsVisible(false)}
                                style={{ flex: 1 }}
                            >
                                <Text variant="h6">Cancel</Text>
                            </Button>
                            <Button
                                variant="outline"
                                size="default"
                                onPress={() => {
                                    const src = tempDuration ?? initialDuration ?? { hours: 0, minutes: 0, seconds: 0 };
                                    const confirmed = new Date(1970, 0, 1, src.hours ?? 0, src.minutes ?? 0, 0, 0);
                                    setLocalSelectedTime(confirmed);
                                    onTimeSelect?.(confirmed);
                                    setIsVisible(false);
                                }}
                                style={{ flex: 1 }}
                            >
                                <Text variant="h6">Confirm</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal >
        </>
    );
}

