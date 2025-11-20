import { useMemo } from "react";
import { Pressable, View } from "react-native"
import { ChevronDown, ChevronUp, PlusIcon } from "lucide-react-native";
import { WorkDayDataProps } from "./type"
import { WeekdayToggle } from "@/components/lib/weekday-toggle";
import { convertTimeToISOString, sortWeekdays, convertTimeToHHMMString, capitalizeFirstLetter } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Collapse } from "@/components/lib/collapse";
import { Text } from "@/components/ui/text"
import { TimePicker } from "@/components/lib/time-picker";
import { TimeDurationPicker } from "@/components/lib/time-duration-picker";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Trash } from "lucide-react-native";
import { Input } from "@/components/ui/input";

interface WorkDayProps {
    workDayData: WorkDayDataProps;
    updateWorkDayData: (updates: Partial<WorkDayDataProps>) => void;
}

export const WorkDay = ({ workDayData, updateWorkDayData }: WorkDayProps) => {

    const defaultConsultInitialTime = useMemo(() => new Date(2024, 0, 1, 9, 0), []);

    const handleToggleDay = (day: string) => {
        const isSelected = workDayData.workDays?.includes(day);
        const nextWorkDays = sortWeekdays(
            isSelected
                ? (workDayData.workDays || []).filter(d => d !== day)
                : [...(workDayData.workDays || []), day]
        );

        let nextStartTimes = { ...workDayData.startTimes };
        let nextEndTimes = { ...workDayData.endTimes };

        if (isSelected) {
            // When toggling off, remove existing entries for this day
            const { [day]: _removedStart, ...restStart } = nextStartTimes;
            const { [day]: _removedEnd, ...restEnd } = nextEndTimes;
            nextStartTimes = restStart;
            nextEndTimes = restEnd;
        } else {
            // When toggling on, ensure defaults exist
            nextStartTimes = { ...nextStartTimes, [day]: workDayData.startTimes[day] || '09:00' };
            nextEndTimes = { ...nextEndTimes, [day]: workDayData.endTimes[day] || '17:00' };
        }

        updateWorkDayData({
            workDays: nextWorkDays,
            startTimes: nextStartTimes,
            endTimes: nextEndTimes,
        } as Partial<WorkDayDataProps>);
    };

    const handleToggleDiffTime = (checked: boolean) => {
        updateWorkDayData({ diffTimeEnabled: checked });
        if (!checked) {
            const firstDay = workDayData.workDays?.[0];
            if (firstDay && workDayData.startTimes?.[firstDay] && workDayData.endTimes?.[firstDay]) {
                const startTime = workDayData.startTimes[firstDay];
                const endTime = workDayData.endTimes[firstDay];
                const nextStartTimes = { ...workDayData.startTimes };
                const nextEndTimes = { ...workDayData.endTimes };
                workDayData.workDays?.forEach(day => {
                    nextStartTimes[day] = startTime;
                    nextEndTimes[day] = endTime;
                });
                updateWorkDayData({ startTimes: nextStartTimes, endTimes: nextEndTimes } as Partial<WorkDayDataProps>);
            }
        }
    };

    const setAllStartTimes = (time: Date) => {
        const newStartTimes: Record<string, string> = {};
        workDayData.workDays?.forEach(day => {
            newStartTimes[day] = convertTimeToHHMMString(time);
        });
        updateWorkDayData({ startTimes: newStartTimes } as Partial<WorkDayDataProps>);
    };

    const setAllEndTimes = (time: Date) => {
        const newEndTimes: Record<string, string> = {};
        workDayData.workDays?.forEach(day => {
            newEndTimes[day] = convertTimeToHHMMString(time);
        });
        updateWorkDayData({ endTimes: newEndTimes } as Partial<WorkDayDataProps>);
    };

    const handleBothConsultsChange = (checked: boolean) => {
        updateWorkDayData({ consultInPerson: checked, consultOnline: checked } as Partial<WorkDayDataProps>);
    };

    const handleToggleConsultDay = (day: string) => {
        const isSelected = workDayData.consultWorkDays?.includes(day);
        const nextConsultWorkDays = sortWeekdays(
            isSelected
                ? (workDayData.consultWorkDays || []).filter(d => d !== day)
                : [...(workDayData.consultWorkDays || []), day]
        );

        let nextConsultStartTimes: Record<string, string[]> = { ...(workDayData.consultStartTimes || {}) };

        if (isSelected) {
            // Remove times for this day when toggling off
            const { [day]: _removed, ...rest } = nextConsultStartTimes;
            nextConsultStartTimes = rest;
        } else {
            // When toggling on, seed default times for this day
            const templateDay = (workDayData.consultWorkDays || []).find(d => (workDayData.consultStartTimes?.[d]?.length || 0) > 0);
            const templateTimes = templateDay
                ? (workDayData.consultStartTimes?.[templateDay] || [])
                : [convertTimeToHHMMString(defaultConsultInitialTime)];
            nextConsultStartTimes[day] = templateTimes;
        }

        updateWorkDayData({ consultWorkDays: nextConsultWorkDays, consultStartTimes: nextConsultStartTimes } as Partial<WorkDayDataProps>);
    };

    const handleToggleDiffConsultTime = (checked: boolean) => {
        updateWorkDayData({ diffConsultTimeEnabled: checked } as Partial<WorkDayDataProps>);
        if (!checked) {
            const firstDay = workDayData.consultWorkDays?.[0];
            if (firstDay && workDayData.consultStartTimes?.[firstDay]) {
                const times = workDayData.consultStartTimes[firstDay];
                const nextConsultStartTimes = { ...workDayData.consultStartTimes };
                workDayData.consultWorkDays?.forEach(day => {
                    nextConsultStartTimes[day] = times;
                });
                updateWorkDayData({ consultStartTimes: nextConsultStartTimes } as Partial<WorkDayDataProps>);
            }
        }
    };

    // Per-day consult time editors (when diffConsultTimeEnabled is true)
    const updateConsultStartForDay = (day: string, index: number, time: Date) => {
        const nextConsultStartTimes: Record<string, string[]> = { ...(workDayData.consultStartTimes || {}) };
        const currentTimesForDay = [...(nextConsultStartTimes[day] || [])];
        currentTimesForDay[index] = convertTimeToHHMMString(time);
        nextConsultStartTimes[day] = currentTimesForDay;
        updateWorkDayData({ consultStartTimes: nextConsultStartTimes } as Partial<WorkDayDataProps>);
    };

    const removeConsultStartForDay = (day: string, index: number) => {
        const nextConsultStartTimes: Record<string, string[]> = { ...(workDayData.consultStartTimes || {}) };
        const currentTimesForDay = (nextConsultStartTimes[day] || []).filter((_, i) => i !== index);
        nextConsultStartTimes[day] = currentTimesForDay;
        updateWorkDayData({ consultStartTimes: nextConsultStartTimes } as Partial<WorkDayDataProps>);
    };

    const addConsultStartTimeToDay = (day: string, time: Date) => {
        const nextConsultStartTimes: Record<string, string[]> = { ...(workDayData.consultStartTimes || {}) };
        const currentTimesForDay = [...(nextConsultStartTimes[day] || [])];
        currentTimesForDay.push(convertTimeToHHMMString(time));
        nextConsultStartTimes[day] = currentTimesForDay;
        updateWorkDayData({ consultStartTimes: nextConsultStartTimes } as Partial<WorkDayDataProps>);
    };

    const addAnotherConsultStartTimeToDay = (day: string) => {
        const currentTimesForDay = workDayData.consultStartTimes?.[day] || [];
        const lastTimeString = currentTimesForDay[currentTimesForDay.length - 1];
        const baseDate = lastTimeString ? convertTimeToISOString(lastTimeString) : defaultConsultInitialTime;
        const plusOneHour = new Date(baseDate);
        plusOneHour.setHours(plusOneHour.getHours() + 1);
        addConsultStartTimeToDay(day, plusOneHour);
    };

    const updateConsultStartTimeForAllDays = (index: number, time: Date) => {
        const newConsultStartTimes: Record<string, string[]> = {};
        workDayData.consultWorkDays?.forEach(day => {
            const currentTimes = workDayData.consultStartTimes?.[day] || [];
            newConsultStartTimes[day] = currentTimes.map((_, i) => i === index ? convertTimeToHHMMString(time) : _);
        });
        updateWorkDayData({ consultStartTimes: newConsultStartTimes } as Partial<WorkDayDataProps>);
    };

    const setAllConsultStartTimes = (time: Date) => {
        const newConsultStartTimes: Record<string, string[]> = {};
        workDayData.consultWorkDays?.forEach(day => {
            newConsultStartTimes[day] = [convertTimeToHHMMString(time)];
        });
        updateWorkDayData({ consultStartTimes: newConsultStartTimes } as Partial<WorkDayDataProps>);
    };

    const addConsultStartTimeToAllDays = () => {
        const newConsultStartTimes: Record<string, string[]> = {};
        // Get current times from first day (they should all be the same)
        const firstDay = workDayData.consultWorkDays?.[0];
        const currentTimes = firstDay ? (workDayData.consultStartTimes?.[firstDay] || []) : [];
        // Add a new time to all days (+1h from the last start time)
        const lastTimeString = currentTimes[currentTimes.length - 1];
        const baseDate = lastTimeString ? convertTimeToISOString(lastTimeString) : defaultConsultInitialTime;
        const plusOneHour = new Date(baseDate);
        plusOneHour.setHours(plusOneHour.getHours() + 1);
        const newTime = convertTimeToHHMMString(plusOneHour);
        workDayData.consultWorkDays?.forEach(day => { newConsultStartTimes[day] = [...currentTimes, newTime]; });
        updateWorkDayData({ consultStartTimes: newConsultStartTimes } as Partial<WorkDayDataProps>);
    };

    // Helpers for non-diff consult times (shared across days)
    const getSharedConsultStartTimes = (): string[] => {
        const firstDay = workDayData.consultWorkDays?.[0];
        return firstDay ? (workDayData.consultStartTimes?.[firstDay] || []) : [];
    };

    const addConsultStart = (time: Date) => {
        setAllConsultStartTimes(time);
    };

    const updateConsultStart = (index: number, time: Date) => {
        updateConsultStartTimeForAllDays(index, time);
    };

    const removeConsultStart = (index: number) => {
        const newConsultStartTimes: Record<string, string[]> = {};
        workDayData.consultWorkDays?.forEach(day => {
            const currentTimes = workDayData.consultStartTimes?.[day] || [];
            newConsultStartTimes[day] = currentTimes.filter((_, i) => i !== index);
        });
        updateWorkDayData({ consultStartTimes: newConsultStartTimes } as Partial<WorkDayDataProps>);
    };

    const addAnotherConsultStart = () => {
        addConsultStartTimeToAllDays();
    };

    return (
        <View className="gap-6 mt-4">
            <View className="gap-4">
                <Text variant="h5">Work Days</Text>
                <View className="gap-2">
                    <WeekdayToggle
                        selectedDays={workDayData.workDays || []}
                        onToggleDay={handleToggleDay}
                    />
                </View>
            </View>

            <View className="flex-row items-start gap-1">
                <Pressable className="flex-1 gap-2" onPress={() => handleToggleDiffTime(!workDayData.diffTimeEnabled)}>
                    <Text variant="h5" className="w-[310px]">Do these days have different start & end times?</Text>
                </Pressable>
                <View>
                    <Switch
                        checked={workDayData.diffTimeEnabled || false}
                        onCheckedChange={handleToggleDiffTime} />
                </View>
            </View>

            {workDayData.diffTimeEnabled ? (
                <View className="gap-6">
                    {sortWeekdays(workDayData.workDays || []).map((day, index) => {
                        return (
                            <View key={index} className="gap-4 flex-row items-start justify-between">
                                <View className="w-[80px]">
                                    <Text variant="h5">{capitalizeFirstLetter(day)}</Text>
                                </View>
                                <View className="flex-1 gap-4">
                                    <View className="items-start gap-2">
                                        <Collapse title="Start Time" >
                                            <View className="gap-2 w-full">
                                                <TimePicker
                                                    minuteInterval={15}
                                                    className="w-full"
                                                    selectedTime={convertTimeToISOString(workDayData.startTimes?.[day] || '09:00')}
                                                    onTimeSelect={(time) => updateWorkDayData({ startTimes: { ...workDayData.startTimes, [day]: convertTimeToHHMMString(time) } } as Partial<WorkDayDataProps>)}
                                                />
                                            </View>
                                        </Collapse>
                                    </View>
                                    <View className="items-start gap-2">
                                        <Collapse title="End Time" >
                                            <View className="gap-2 w-full">
                                                <TimePicker
                                                    minuteInterval={15}
                                                    className="w-full"
                                                    selectedTime={convertTimeToISOString(workDayData.endTimes?.[day] || '17:00')}
                                                    onTimeSelect={(time) => updateWorkDayData({ endTimes: { ...workDayData.endTimes, [day]: convertTimeToHHMMString(time) } } as Partial<WorkDayDataProps>)}
                                                />
                                            </View>
                                        </Collapse>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            ) : (
                <View className="gap-6">
                    <View className="items-start gap-2">
                        <Collapse title="Start Time" textClassName="text-xl" >
                            <View className="gap-2 w-full">
                                {(() => {
                                    const firstDay = workDayData.workDays?.[0];
                                    const startTimeString = firstDay ? (workDayData.startTimes?.[firstDay] || '09:00') : '09:00';
                                    return (
                                        <TimePicker
                                            minuteInterval={15}
                                            className="w-full"
                                            selectedTime={convertTimeToISOString(startTimeString)}
                                            onTimeSelect={(time) => setAllStartTimes(time)}
                                        />
                                    );
                                })()}
                            </View>
                        </Collapse>
                    </View>

                    <View className="items-start gap-2">
                        <Collapse title="End Time" textClassName="text-xl" >
                            <View className="gap-2 w-full">
                                {(() => {
                                    const firstDay = workDayData.workDays?.[0];
                                    const endTimeString = firstDay ? (workDayData.endTimes?.[firstDay] || '17:00') : '17:00';
                                    return (
                                        <TimePicker
                                            minuteInterval={15}
                                            className="w-full"
                                            selectedTime={convertTimeToISOString(endTimeString)}
                                            onTimeSelect={(time) => setAllEndTimes(time)}
                                        />
                                    );
                                })()}
                            </View>
                        </Collapse>
                    </View>
                </View>
            )}

            <View className="flex-row items-start gap-2">
                <Pressable className="flex-1 gap-2" onPress={() => updateWorkDayData({ consultEnabled: !workDayData.consultEnabled })}>
                    <Text className="text-xl leading-none">
                        Do you offer consults?
                    </Text>
                    <Text className="text-text-secondary leading-5">If yes, you can set up your consult details here</Text>
                </Pressable>
                <Switch
                    checked={workDayData.consultEnabled || false}
                    onCheckedChange={(checked) => updateWorkDayData({ consultEnabled: checked } as Partial<WorkDayDataProps>)}
                />
            </View>

            {workDayData.consultEnabled && (
                <View className="gap-6">
                    <View className="flex-row items-start gap-2">
                        <Pressable className="flex-1 gap-2" onPress={() => updateWorkDayData({ consultInPerson: !workDayData.consultInPerson })}>
                            <Text className="text-xl leading-none">
                                I offer in-person consults
                            </Text>
                        </Pressable>
                        <Switch
                            checked={workDayData.consultInPerson || false}
                            onCheckedChange={(checked) => updateWorkDayData({ consultInPerson: checked } as Partial<WorkDayDataProps>)}
                        />
                    </View>
                    <View className="flex-row items-start gap-2">
                        <Pressable className="flex-1 gap-2" onPress={() => updateWorkDayData({ consultOnline: !workDayData.consultOnline })}>
                            <Text className="text-xl leading-none">
                                I offer online consults
                            </Text>
                        </Pressable>
                        <Switch
                            checked={workDayData.consultOnline || false}
                            onCheckedChange={(checked) => updateWorkDayData({ consultOnline: checked } as Partial<WorkDayDataProps>)}
                        />
                    </View>
                    <View className="flex-row items-start gap-2">
                        <Pressable className="flex-1 gap-2" onPress={() => handleBothConsultsChange(!(workDayData.consultInPerson && workDayData.consultOnline))}>
                            <Text className="text-xl leading-none">
                                I offer both
                            </Text>
                        </Pressable>
                        <Switch
                            checked={workDayData.consultInPerson && workDayData.consultOnline || false}
                            onCheckedChange={(checked) => handleBothConsultsChange(checked)}
                        />
                    </View>

                    <View className="gap-2">
                        <Text variant="h5">Consult length</Text>
                        <TimeDurationPicker
                            selectedDuration={workDayData.consultDuration || 0}
                            onDurationSelect={(duration: number) => updateWorkDayData({ consultDuration: duration } as Partial<WorkDayDataProps>)}
                            minuteInterval={15}
                            minDuration={15}
                            maxDuration={525}
                            modalTitle="Select Session Duration"
                        />
                    </View>

                    <View className="gap-4">
                        <Text variant="h5">Consult Days</Text>
                        <WeekdayToggle
                            selectedDays={workDayData.consultWorkDays || []}
                            onToggleDay={handleToggleConsultDay}
                        />
                    </View>

                    <View className="flex-row items-start gap-2">
                        <Pressable className="flex-1 gap-2" onPress={() => handleToggleDiffConsultTime(!workDayData.diffConsultTimeEnabled)}>
                            <Text className="text-xl leading-1">Do these days have different start times?</Text>
                        </Pressable>
                        <Switch
                            checked={workDayData.diffConsultTimeEnabled || false}
                            onCheckedChange={handleToggleDiffConsultTime} />
                    </View>

                    {workDayData.diffConsultTimeEnabled ? (
                        <View className="gap-4">
                            <Text variant="h5">Consult start times per day</Text>
                            {sortWeekdays(workDayData.consultWorkDays || []).map((day, dayIndex) => {
                                const dayStartTimes = workDayData.consultStartTimes?.[day] || [];
                                return (
                                    <View key={dayIndex} className="gap-4 flex-row items-start">
                                        <View className="w-[80px]">
                                            <Text variant="h6">{capitalizeFirstLetter(day)}</Text>
                                        </View>
                                        <View className="gap-2 flex-1">
                                            <Collapse title="Start Time" >
                                                <View className="gap-2 w-full">
                                                    {dayStartTimes.map((startTime, index) => (
                                                        <View key={index} className="flex-row items-center gap-2">
                                                            <View className="flex-1">
                                                                <TimePicker
                                                                    selectedTime={convertTimeToISOString(startTime) as Date}
                                                                    onTimeSelect={(time) => updateConsultStartForDay(day, index, time)}
                                                                    minuteInterval={15}
                                                                    placeholder="Select appointment time"
                                                                    modalTitle={`Choose ${day} Time`}
                                                                />
                                                            </View>
                                                            {dayStartTimes.length > 1 && index > 0 && (
                                                                <Button variant="outline" className='h-10 w-10' onPress={() => removeConsultStartForDay(day, index)}>
                                                                    <Icon as={Trash} size={20} />
                                                                </Button>
                                                            )}
                                                        </View>
                                                    ))}
                                                    {(!dayStartTimes || dayStartTimes.length === 0) && (
                                                        <TimePicker
                                                            selectedTime={defaultConsultInitialTime}
                                                            onTimeSelect={(time: Date) => addConsultStartTimeToDay(day, time)}
                                                            minuteInterval={15}
                                                            placeholder="Select appointment time"
                                                            modalTitle="Choose Time"
                                                        />
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        className="h-8 items-center justify-center p-0"
                                                        onPress={() => addAnotherConsultStartTimeToDay(day)}>
                                                        <Text>Add Another Start Time</Text>
                                                        <Icon as={PlusIcon} size={20} />
                                                    </Button>
                                                </View>
                                            </Collapse>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View className="gap-4">
                            <Text variant="h5">Consult start times</Text>
                            {(() => {
                                const startTimes = getSharedConsultStartTimes();
                                return (
                                    <>
                                        {startTimes.map((startTime, index) => (
                                            <View key={index} className="flex-row items-center gap-2">
                                                <View className="flex-1">
                                                    <TimePicker
                                                        selectedTime={convertTimeToISOString(startTime) as Date}
                                                        onTimeSelect={(time) => updateConsultStart(index, time)}
                                                        minuteInterval={15}
                                                        placeholder="Select appointment time"
                                                        modalTitle="Choose Time"
                                                    />
                                                </View>
                                                {startTimes.length > 1 && index > 0 && (
                                                    <Button variant="outline" className='h-10 w-10' onPress={() => removeConsultStart(index)}>
                                                        <Icon as={Trash} size={20} />
                                                    </Button>
                                                )}
                                            </View>
                                        ))}
                                        {(!workDayData.consultWorkDays || workDayData.consultWorkDays.length === 0) ? (
                                            <Text className="text-text-secondary">Please select consult work days first</Text>
                                        ) : (startTimes.length === 0) ? (
                                            <TimePicker
                                                selectedTime={defaultConsultInitialTime}
                                                onTimeSelect={addConsultStart}
                                                minuteInterval={15}
                                                placeholder="Select appointment time"
                                                modalTitle="Choose Time"
                                            />
                                        ) : null}
                                        <Button variant="outline" onPress={addAnotherConsultStart}>
                                            <Text>Add Another Start Time</Text>
                                            <Icon as={PlusIcon} size={20} />
                                        </Button>
                                    </>
                                );
                            })()}
                        </View>
                    )}

                    <View className="gap-2">
                        <Text variant="h5">Meeting platform credentials</Text>
                        <Input
                            value={workDayData.consultMeetingLink || ''}
                            onChangeText={(text) => updateWorkDayData({ consultMeetingLink: text } as Partial<WorkDayDataProps>)}
                        />
                    </View>
                </View>
            )}
        </View>
    )
}