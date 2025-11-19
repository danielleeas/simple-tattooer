import React, { useMemo, useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Note } from '@/components/ui/note';
import { ChevronDown, ChevronUp, PlusIcon, Trash } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';
import { Input } from '@/components/ui/input';
import { WeekdayToggle } from '@/components/lib/weekday-toggle';
import { TimePicker } from '@/components/lib/time-picker';
import { Switch } from '@/components/ui/switch';
import { TimeDurationPicker } from '@/components/lib/time-duration-picker';
import { capitalizeFirstLetter, sortWeekdays } from '@/lib/utils';

export function CalendarStep() {
  const { calendar, updateCalendar, updateDailyStartTime, updateDailyEndTime, updateConsultationDailyStartTimes } = useSetupWizard();

  // Memoized sorted weekdays to avoid calling hooks conditionally in JSX
  const sortedWorkDays = useMemo(() => sortWeekdays(calendar.workDays), [calendar.workDays]);
  const sortedConsultWorkDays = useMemo(
    () => sortWeekdays(calendar.consultation.workDays),
    [calendar.consultation.workDays]
  );
  // Stable default time to avoid passing new Date() in render
  const defaultConsultInitialTime = useMemo(() => new Date(2024, 0, 1, 9, 0), []);

  const handleToggleDay = (day: string) => {
    const newWorkDays = calendar.workDays.includes(day)
      ? calendar.workDays.filter(d => d !== day)
      : [...calendar.workDays, day];
    updateCalendar({ workDays: sortWeekdays(newWorkDays) });
  };

  const handleToggleWorkDay = (day: string) => {
    const newWorkDays = calendar.consultation.workDays.includes(day)
      ? calendar.consultation.workDays.filter(d => d !== day)
      : [...calendar.consultation.workDays, day];
    updateCalendar({ consultation: { ...calendar.consultation, workDays: sortWeekdays(newWorkDays) } });
  };

  const handleStartTimeChange = (time: Date) => {
    updateCalendar({ startTime: time });
  };

  const handleEndTimeChange = (time: Date) => {
    updateCalendar({ endTime: time });
  };

  const handleConsultStartTimeChange = (time: Date) => {
    // Add new time to the array
    const currentStartTimes = calendar.consultation.startTimes;
    const newStartTimes = [...currentStartTimes, time];
    updateCalendar({ consultation: { ...calendar.consultation, startTimes: newStartTimes } });
  };

  const handleUpdateConsultStartTime = (index: number, time: Date) => {
    // Update existing time at specific index
    const newStartTimes = [...calendar.consultation.startTimes];
    newStartTimes[index] = time;
    updateCalendar({ consultation: { ...calendar.consultation, startTimes: newStartTimes } });
  };

  const handleRemoveConsultStartTime = (index: number) => {
    // Prevent removal if it's the last start time
    if (calendar.consultation.startTimes.length <= 1) {
      return;
    }
    // Remove time at specific index
    const newStartTimes = calendar.consultation.startTimes.filter((_, i) => i !== index);
    updateCalendar({ consultation: { ...calendar.consultation, startTimes: newStartTimes } });
  };

  // Helper function to get consultation start times for a specific day
  const getConsultStartTimesForDay = (day: string): Date[] => {
    if (calendar.consultation.isDifferentStartTimes && calendar.consultation.dailyStartTimes[day]) {
      return calendar.consultation.dailyStartTimes[day];
    }
    return calendar.consultation.startTimes;
  };

  // Helper function to handle consultation start time change for a specific day
  const handleConsultStartTimeChangeForDay = (day: string, time: Date) => {
    if (calendar.consultation.isDifferentStartTimes) {
      const currentTimes = getConsultStartTimesForDay(day);
      const newTimes = [...currentTimes, time];
      updateConsultationDailyStartTimes(day, newTimes);
    } else {
      handleConsultStartTimeChange(time);
    }
  };

  // Helper function to update consultation start time for a specific day
  const handleUpdateConsultStartTimeForDay = (day: string, index: number, time: Date) => {
    if (calendar.consultation.isDifferentStartTimes) {
      const currentTimes = getConsultStartTimesForDay(day);
      const newTimes = [...currentTimes];
      newTimes[index] = time;
      updateConsultationDailyStartTimes(day, newTimes);
    } else {
      handleUpdateConsultStartTime(index, time);
    }
  };

  // Helper function to remove consultation start time for a specific day
  const handleRemoveConsultStartTimeForDay = (day: string, index: number) => {
    if (calendar.consultation.isDifferentStartTimes) {
      const currentTimes = getConsultStartTimesForDay(day);
      // Prevent removal if it's the last start time for this day
      if (currentTimes.length <= 1) {
        return;
      }
      const newTimes = currentTimes.filter((_, i) => i !== index);
      updateConsultationDailyStartTimes(day, newTimes);
    } else {
      handleRemoveConsultStartTime(index);
    }
  };

  const isBothConsults = calendar.consultation.isOnline && calendar.consultation.isInPerson;

  const handleBothConsultsChange = (checked: boolean) => {
    updateCalendar({ consultation: { ...calendar.consultation, isOnline: checked, isInPerson: checked } });
  };

  const handleToggleDifferentStartTimes = (checked: boolean) => {
    if (checked) {
      // When enabling different start times, initialize daily start times for each work day
      const dailyStartTimes: Record<string, Date[]> = {};
      calendar.consultation.workDays.forEach(day => {
        // Use existing startTimes as default for each day, or create a default if none exist
        dailyStartTimes[day] = calendar.consultation.startTimes.length > 0 
          ? [...calendar.consultation.startTimes] 
          : [new Date(2024, 0, 1, 9, 0)];
      });
      
      updateCalendar({ 
        consultation: { 
          ...calendar.consultation, 
          isDifferentStartTimes: checked,
          dailyStartTimes 
        } 
      });
    } else {
      // When disabling different start times, ensure we have at least one start time
      const startTimes = calendar.consultation.startTimes.length > 0 
        ? calendar.consultation.startTimes 
        : [new Date(2024, 0, 1, 9, 0)];
        
      updateCalendar({ 
        consultation: { 
          ...calendar.consultation, 
          isDifferentStartTimes: checked,
          startTimes
        } 
      });
    }
  };

  // Helper function to get start time for a specific day
  const getStartTimeForDay = (day: string): Date => {
    if (calendar.isDifferentHours && calendar.dailyStartTimes[day]) {
      return calendar.dailyStartTimes[day];
    }
    return calendar.startTime;
  };

  // Helper function to get end time for a specific day
  const getEndTimeForDay = (day: string): Date => {
    if (calendar.isDifferentHours && calendar.dailyEndTimes[day]) {
      return calendar.dailyEndTimes[day];
    }
    return calendar.endTime;
  };

  // Helper function to handle start time change for a specific day
  const handleStartTimeChangeForDay = (day: string, time: Date) => {
    if (calendar.isDifferentHours) {
      updateDailyStartTime(day, time);
    } else {
      updateCalendar({ startTime: time });
    }
  };

  // Helper function to handle end time change for a specific day
  const handleEndTimeChangeForDay = (day: string, time: Date) => {
    if (calendar.isDifferentHours) {
      updateDailyEndTime(day, time);
    } else {
      updateCalendar({ endTime: time });
    }
  };

  const [dateTimeToggles, setDateTimeToggles] = useState<Record<string, {
    startTimeOpen: boolean;
    endTimeOpen: boolean;
    startTime: Date | null;
    endTime: Date | null;
  }>>({});
  const getWeekdayKey = (weekday: string) => weekday;

  const getDateTimeState = (weekday: string) => {
    const key = getWeekdayKey(weekday);
    return dateTimeToggles[key] || {
      startTimeOpen: false,
      endTimeOpen: false,
      startTime: null,
      endTime: null
    };
  };

  const updateDateTimeState = (weekday: string, updates: Partial<{
    startTimeOpen: boolean;
    endTimeOpen: boolean;
    startTime: Date | null;
    endTime: Date | null;
  }>) => {
    const key = getWeekdayKey(weekday);
    setDateTimeToggles(prev => ({
      ...prev,
      [key]: {
        ...getDateTimeState(weekday),
        ...updates
      }
    }));
  };

  return (
    <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View className="gap-6 pb-4">
        <View className="items-center justify-center">
          <Image
            source={require('@/assets/images/icons/calendar.png')}
            style={{ width: 56, height: 56 }}
            resizeMode="contain"
          />
          <Text variant="h6" className="text-center uppercase">calendar</Text>
          <Text variant="h6" className="text-center uppercase leading-none">setup</Text>
          <Text className="text-center mt-2 text-text-secondary">Pick your work days and hours — keep your</Text>
          <Text className="text-center text-text-secondary">bookings stress-free</Text>
        </View>

        <View className="gap-4">
          <Text variant="h5">Work Days</Text>
          <View className="gap-2">
            <Text className="text-text-secondary">Nothing is set in stone. Make changes anytime in Settings.</Text>
            <WeekdayToggle
              selectedDays={calendar.workDays}
              onToggleDay={handleToggleDay}
            />
          </View>
        </View>
        <View className="flex-row items-start gap-2">
          <Pressable className="flex-1 gap-2" onPress={() => updateCalendar({ isDifferentHours: !calendar.isDifferentHours })}>
            <Text className="text-xl leading-1">
              Do these days have different start & end hours?
            </Text>
          </Pressable>
          <Switch
            checked={calendar.isDifferentHours}
            onCheckedChange={(checked) => updateCalendar({ isDifferentHours: checked })}
          />
        </View>

        <View className="gap-4">
          {!calendar.isDifferentHours ? (
            // Show single time pickers when different hours is disabled
            <>
              <View className="gap-2">
                <Text variant="h5">Start Time</Text>
                <TimePicker
                  selectedTime={calendar.startTime}
                  onTimeSelect={handleStartTimeChange}
                  minuteInterval={15}
                  placeholder="Select appointment time"
                  modalTitle="Choose Time"
                />
              </View>
              <View className="gap-2">
                <Text variant="h5">End Time</Text>
                <TimePicker
                  selectedTime={calendar.endTime}
                  onTimeSelect={handleEndTimeChange}
                  minuteInterval={15}
                  placeholder="Select appointment time"
                  modalTitle="Choose Time"
                />
              </View>
            </>
          ) : (
            // Show per-day time pickers when different hours is enabled
            <View className="gap-4">
              {sortedWorkDays.map((day) => {
                const dateState = getDateTimeState(day);
                return (
                  <View key={day} className="gap-4 flex-row items-start justify-between">
                    <View className="w-[80px]">
                      <Text variant="h5">{capitalizeFirstLetter(day)}</Text>
                    </View>
                    <View className="flex-1 gap-4">
                      <View className="items-start gap-2 flex-1">
                        <Pressable
                          className="w-full flex-row items-center justify-between"
                          onPress={() => updateDateTimeState(day, { startTimeOpen: !dateState.startTimeOpen })}
                        >
                          <Text>Start Time</Text>
                          <Icon as={dateState.startTimeOpen ? ChevronUp : ChevronDown} size={20} />
                        </Pressable>
                        <View className="w-full">
                          {dateState.startTimeOpen && (
                            <TimePicker
                              selectedTime={getStartTimeForDay(day)}
                              onTimeSelect={(time) => handleStartTimeChangeForDay(day, time)}
                              minuteInterval={15}
                              placeholder="Select start time"
                              modalTitle={`Choose ${day} Start Time`}
                            />
                          )}
                        </View>
                      </View>
                      <View className="items-start gap-2 flex-1">
                        <Pressable
                          className="w-full flex-row items-center justify-between"
                          onPress={() => updateDateTimeState(day, { endTimeOpen: !dateState.endTimeOpen })}
                        >
                          <Text>End Time</Text>
                          <Icon as={dateState.endTimeOpen ? ChevronUp : ChevronDown} size={20} />
                        </Pressable>
                        <View className="w-full">
                          {dateState.endTimeOpen && (
                            <TimePicker
                              selectedTime={getEndTimeForDay(day)}
                              onTimeSelect={(time) => handleEndTimeChangeForDay(day, time)}
                              minuteInterval={15}
                              placeholder="Select end time"
                              modalTitle={`Choose ${day} End Time`}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
              {calendar.workDays.length === 0 && (
                <Text className="text-text-secondary text-center py-4">
                  Select work days above to set individual times
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="items-center justify-center">
          <Image
            source={require('@/assets/images/icons/consult.png')}
            style={{ width: 56, height: 65 }}
            resizeMode="contain"
          />
          <Text variant="h6" className="text-center uppercase">Consult</Text>
          <Text variant="h6" className="text-center uppercase leading-none">Calendar Setup</Text>
          <Text className="text-center mt-2 text-text-secondary">Set your consult availability and link your</Text>
          <Text className="text-center text-text-secondary">Zoom or Google Meet — no back and forth.</Text>
        </View>

        <View className="flex-row items-start gap-2">
          <Pressable className="flex-1 gap-2" onPress={() => updateCalendar({ consultation: { ...calendar.consultation, isOffer: !calendar.consultation.isOffer } })}>
            <Text className="text-xl leading-none">
              Do you offer consults?
            </Text>
            <Text className="text-text-secondary leading-5">If yes, you can set up your consult details here</Text>
          </Pressable>
          <Switch
            checked={calendar.consultation.isOffer}
            onCheckedChange={(checked) => updateCalendar({ consultation: { ...calendar.consultation, isOffer: checked } })}
          />
        </View>

        {calendar.consultation.isOffer && (
          <View className="gap-4">
            <View className="flex-row items-start gap-2">
              <Pressable className="flex-1 gap-2" onPress={() => updateCalendar({ consultation: { ...calendar.consultation, isInPerson: !calendar.consultation.isInPerson } })}>
                <Text className="text-xl leading-none">
                  I offer in-person consults
                </Text>
              </Pressable>
              <Switch
                checked={calendar.consultation.isInPerson}
                onCheckedChange={(checked) => updateCalendar({ consultation: { ...calendar.consultation, isInPerson: checked } })}
              />
            </View>

            <View className="flex-row items-start gap-2">
              <Pressable className="flex-1 gap-2" onPress={() => updateCalendar({ consultation: { ...calendar.consultation, isOnline: !calendar.consultation.isOnline } })}>
                <Text className="text-xl leading-none">
                  I offer online consults
                </Text>
              </Pressable>
              <Switch
                checked={calendar.consultation.isOnline}
                onCheckedChange={(checked) => updateCalendar({ consultation: { ...calendar.consultation, isOnline: checked } })}
              />
            </View>

            <View className="flex-row items-start gap-2">
              <Pressable className="flex-1 gap-2" onPress={() => handleBothConsultsChange(!isBothConsults)}>
                <Text className="text-xl leading-none">
                  I offer both
                </Text>
              </Pressable>
              <Switch
                checked={isBothConsults}
                onCheckedChange={(checked) => handleBothConsultsChange(checked)}
              />
            </View>

            <View className="gap-2">
              <Text variant="h5">Consult length</Text>
              <TimeDurationPicker
                selectedDuration={calendar.consultation.duration}
                onDurationSelect={(duration) => updateCalendar({ consultation: { ...calendar.consultation, duration: duration } })}
                minuteInterval={15}
                minDuration={15}
                maxDuration={240} // 4 hours max
                modalTitle="Select Session Duration"
              />
            </View>

            <View className="gap-4">
              <Text variant="h5">Days of the week</Text>
              <WeekdayToggle
                selectedDays={calendar.consultation.workDays}
                onToggleDay={handleToggleWorkDay}
              />
            </View>

            <View className="flex-row items-start gap-2">
              <Pressable className="flex-1 gap-2" onPress={() => handleToggleDifferentStartTimes(!calendar.consultation.isDifferentStartTimes)}>
                <Text className="text-xl leading-1">
                  Do these days have different start times?
                </Text>
              </Pressable>
              <Switch
                checked={calendar.consultation.isDifferentStartTimes}
                onCheckedChange={handleToggleDifferentStartTimes}
              />
            </View>

            <View className="gap-2">
              <Text variant="h5">Consult start times</Text>
              {!calendar.consultation.isDifferentStartTimes ? (
                // Show single start times when different start times is disabled
                <>
                  {calendar.consultation.startTimes.map((startTime, index) => (
                    <View key={index} className="flex-row items-center gap-2">
                      <View className="flex-1">
                        <TimePicker
                          selectedTime={startTime}
                          onTimeSelect={(time) => handleUpdateConsultStartTime(index, time)}
                          minuteInterval={15}
                          placeholder="Select appointment time"
                          modalTitle="Choose Time"
                        />
                      </View>
                      {calendar.consultation.startTimes.length > 1 && index > 0 && (
                        <Button variant="outline" className='h-10 w-10' onPress={() => handleRemoveConsultStartTime(index)}>
                          <Icon as={Trash} size={20} />
                        </Button>
                      )}
                    </View>
                  ))}
                  {calendar.consultation.startTimes.length == 0 && (
                    <TimePicker
                      initialTime={defaultConsultInitialTime}
                      onTimeSelect={handleConsultStartTimeChange}
                      minuteInterval={15}
                      placeholder="Select appointment time"
                      modalTitle="Choose Time"
                    />)}
                  <Button variant="outline" onPress={() => handleConsultStartTimeChange(new Date())}>
                    <Text>Add Another Start Time</Text>
                    <Icon as={PlusIcon} size={20} />
                  </Button>
                </>
              ) : (
                // Show per-day start times when different start times is enabled
                <View className="gap-4">
                  {sortedConsultWorkDays.map((day) => {
                    const dayStartTimes = getConsultStartTimesForDay(day);
                    return (
                      <View key={day} className="gap-4 flex-row items-start justify-between">
                        <View className="w-[80px]">
                          <Text variant="h5">{capitalizeFirstLetter(day)}</Text>
                        </View>
                        <View className="flex-1 gap-2">
                          <Text>Start Times</Text>
                          {dayStartTimes.map((startTime, index) => (
                            <View key={index} className="flex-row items-center gap-2">
                              <View className="flex-1">
                                <TimePicker
                                  selectedTime={startTime}
                                  onTimeSelect={(time) => handleUpdateConsultStartTimeForDay(day, index, time)}
                                  minuteInterval={15}
                                  placeholder="Select appointment time"
                                  modalTitle={`Choose ${day} Time`}
                                />
                              </View>
                              {dayStartTimes.length > 1 && index > 0 && (
                                <Button variant="outline" className='h-10 w-10' onPress={() => handleRemoveConsultStartTimeForDay(day, index)}>
                                  <Icon as={Trash} size={20} />
                                </Button>
                              )}
                            </View>
                          ))}
                          {dayStartTimes.length == 0 && (
                            <TimePicker
                              initialTime={defaultConsultInitialTime}
                              onTimeSelect={(time) => handleConsultStartTimeChangeForDay(day, time)}
                              minuteInterval={15}
                              placeholder="Select appointment time"
                              modalTitle={`Choose ${day} Time`}
                            />)}
                          <Button variant="outline" onPress={() => handleConsultStartTimeChangeForDay(day, new Date())}>
                            <Text>Add Another Start Time</Text>
                            <Icon as={PlusIcon} size={20} />
                          </Button>
                        </View>
                      </View>
                    );
                  })}
                  {calendar.consultation.workDays.length === 0 && (
                    <Text className="text-text-secondary text-center py-4">
                      Select consultation work days above to set individual start times
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View className="gap-2">
              <Text variant="h5">Zoom/ Google Meet link</Text>
              <Input
                value={calendar.consultation.meetingLink}
                onChangeText={(text) => updateCalendar({ consultation: { ...calendar.consultation, meetingLink: text } })}
              />
            </View>

          </View>
        )}

        <Note message="You can add this later in Settings." />
      </View>
    </KeyboardAwareScrollView>
  );
}
