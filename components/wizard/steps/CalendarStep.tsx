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

  const toggleWorkDay = (day: string) => {
    const newWorkDays = calendar.workDays.includes(day)
      ? calendar.workDays.filter(d => d !== day)
      : [...calendar.workDays, day];
    updateCalendar({ workDays: sortWeekdays(newWorkDays) });
  };

  const toggleConsultDay = (day: string) => {
    const newWorkDays = calendar.consultation.workDays.includes(day)
      ? calendar.consultation.workDays.filter(d => d !== day)
      : [...calendar.consultation.workDays, day];
    updateCalendar({ consultation: { ...calendar.consultation, workDays: sortWeekdays(newWorkDays) } });
  };

  const setWorkStart = (time: Date) => {
    updateCalendar({ startTime: time });
  };

  const setWorkEnd = (time: Date) => {
    updateCalendar({ endTime: time });
  };

  const addConsultStart = (time: Date) => {
    // Add +1 hour relative to the latest existing start time, or use provided time if none exist
    const currentStartTimes = calendar.consultation.startTimes;

    let nextTime: Date;
    if (currentStartTimes.length > 0) {
      const latest = new Date(
        Math.max(...currentStartTimes.map(t => new Date(t as unknown as Date).getTime()))
      );
      nextTime = new Date(latest);
      nextTime.setHours(latest.getHours() + 1);
    } else {
      nextTime = new Date(time);
    }

    const newStartTimes = [...currentStartTimes, nextTime];
    updateCalendar({ consultation: { ...calendar.consultation, startTimes: newStartTimes } });
  };

  const updateConsultStart = (index: number, time: Date) => {
    // Update existing time at specific index
    const newStartTimes = [...calendar.consultation.startTimes];
    newStartTimes[index] = time;
    updateCalendar({ consultation: { ...calendar.consultation, startTimes: newStartTimes } });
  };

  const removeConsultStart = (index: number) => {
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
  const addConsultStartForDay = (day: string, time: Date) => {
    if (calendar.consultation.isDifferentStartTimes) {
      const currentTimes = getConsultStartTimesForDay(day);

      let nextTime: Date;
      if (currentTimes.length > 0) {
        const latest = new Date(Math.max(...currentTimes.map(t => new Date(t).getTime())));
        nextTime = new Date(latest);
        nextTime.setHours(latest.getHours() + 1);
      } else {
        nextTime = new Date(time);
      }

      const newTimes = [...currentTimes, nextTime];
      updateConsultationDailyStartTimes(day, newTimes);
    } else {
      addConsultStart(time);
    }
  };

  // Helper function to update consultation start time for a specific day
  const updateConsultStartForDay = (day: string, index: number, time: Date) => {
    if (calendar.consultation.isDifferentStartTimes) {
      const currentTimes = getConsultStartTimesForDay(day);
      const newTimes = [...currentTimes];
      newTimes[index] = time;
      updateConsultationDailyStartTimes(day, newTimes);
    } else {
      updateConsultStart(index, time);
    }
  };

  // Helper function to remove consultation start time for a specific day
  const removeConsultStartForDay = (day: string, index: number) => {
    if (calendar.consultation.isDifferentStartTimes) {
      const currentTimes = getConsultStartTimesForDay(day);
      // Prevent removal if it's the last start time for this day
      if (currentTimes.length <= 1) {
        return;
      }
      const newTimes = currentTimes.filter((_, i) => i !== index);
      updateConsultationDailyStartTimes(day, newTimes);
    } else {
      removeConsultStart(index);
    }
  };

  const bothConsultTypes = calendar.consultation.isOnline && calendar.consultation.isInPerson;

  const setBothConsultTypes = (checked: boolean) => {
    updateCalendar({ consultation: { ...calendar.consultation, isOnline: checked, isInPerson: checked } });
  };

  const setConsultPerDayStartTimesEnabled = (checked: boolean) => {
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
  const getWorkStartForDay = (day: string): Date => {
    if (calendar.isDifferentHours && calendar.dailyStartTimes[day]) {
      return calendar.dailyStartTimes[day];
    }
    return calendar.startTime;
  };

  // Helper function to get end time for a specific day
  const getWorkEndForDay = (day: string): Date => {
    if (calendar.isDifferentHours && calendar.dailyEndTimes[day]) {
      return calendar.dailyEndTimes[day];
    }
    return calendar.endTime;
  };

  // Helper function to handle start time change for a specific day
  const setWorkStartForDay = (day: string, time: Date) => {
    if (calendar.isDifferentHours) {
      updateDailyStartTime(day, time);
    } else {
      updateCalendar({ startTime: time });
    }
  };

  // Helper function to handle end time change for a specific day
  const setWorkEndForDay = (day: string, time: Date) => {
    if (calendar.isDifferentHours) {
      updateDailyEndTime(day, time);
    } else {
      updateCalendar({ endTime: time });
    }
  };

  const [dayPickerState, setDayPickerState] = useState<Record<string, {
    startTimeOpen: boolean;
    endTimeOpen: boolean;
    startTime: Date | null;
    endTime: Date | null;
  }>>({});
  const getWeekdayKey = (weekday: string) => weekday;

  const getDayState = (weekday: string) => {
    const key = getWeekdayKey(weekday);
    return dayPickerState[key] || {
      startTimeOpen: false,
      endTimeOpen: false,
      startTime: null,
      endTime: null
    };
  };

  const updateDayState = (weekday: string, updates: Partial<{
    startTimeOpen: boolean;
    endTimeOpen: boolean;
    startTime: Date | null;
    endTime: Date | null;
  }>) => {
    const key = getWeekdayKey(weekday);
    setDayPickerState(prev => ({
      ...prev,
      [key]: {
        ...getDayState(weekday),
        ...updates
      }
    }));
  };

  return (
    <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false} >
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
              onToggleDay={toggleWorkDay}
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
                  onTimeSelect={setWorkStart}
                  minuteInterval={15}
                  placeholder="Select appointment time"
                  modalTitle="Choose Time"
                />
              </View>
              <View className="gap-2">
                <Text variant="h5">End Time</Text>
                <TimePicker
                  selectedTime={calendar.endTime}
                  onTimeSelect={setWorkEnd}
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
                const dateState = getDayState(day);
                return (
                  <View key={day} className="gap-4 flex-row items-start justify-between">
                    <View className="w-[80px]">
                      <Text variant="h5">{capitalizeFirstLetter(day)}</Text>
                    </View>
                    <View className="flex-1 gap-4">
                      <View className="items-start gap-2 flex-1">
                        <Pressable
                          className="w-full flex-row items-center justify-between"
                          onPress={() => updateDayState(day, { startTimeOpen: !dateState.startTimeOpen })}
                        >
                          <Text>Start Time</Text>
                          <Icon as={dateState.startTimeOpen ? ChevronUp : ChevronDown} size={20} />
                        </Pressable>
                        <View className="w-full">
                          {dateState.startTimeOpen && (
                            <TimePicker
                              selectedTime={getWorkStartForDay(day)}
                              onTimeSelect={(time) => setWorkStartForDay(day, time)}
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
                          onPress={() => updateDayState(day, { endTimeOpen: !dateState.endTimeOpen })}
                        >
                          <Text>End Time</Text>
                          <Icon as={dateState.endTimeOpen ? ChevronUp : ChevronDown} size={20} />
                        </Pressable>
                        <View className="w-full">
                          {dateState.endTimeOpen && (
                            <TimePicker
                              selectedTime={getWorkEndForDay(day)}
                              onTimeSelect={(time) => setWorkEndForDay(day, time)}
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
              <Pressable className="flex-1 gap-2" onPress={() => setBothConsultTypes(!bothConsultTypes)}>
                <Text className="text-xl leading-none">
                  I offer both
                </Text>
              </Pressable>
              <Switch
                checked={bothConsultTypes}
                onCheckedChange={(checked) => setBothConsultTypes(checked)}
              />
            </View>

            <View className="gap-2">
              <Text variant="h5">Consult length</Text>
              <TimeDurationPicker
                selectedDuration={Number(calendar.consultation.duration) || undefined}
                onDurationSelect={(duration) => updateCalendar({ consultation: { ...calendar.consultation, duration: duration.toString() } })}
                minuteInterval={15}
                minDuration={15}
                maxDuration={525} // 4 hours max
                modalTitle="Select Session Duration"
              />
            </View>

            <View className="gap-4">
              <Text variant="h5">Days of the week</Text>
              <WeekdayToggle
                selectedDays={calendar.consultation.workDays}
                onToggleDay={toggleConsultDay}
              />
            </View>

            <View className="flex-row items-start gap-2">
              <Pressable className="flex-1 gap-2" onPress={() => setConsultPerDayStartTimesEnabled(!calendar.consultation.isDifferentStartTimes)}>
                <Text className="text-xl leading-1">
                  Do these days have different start times?
                </Text>
              </Pressable>
              <Switch
                checked={calendar.consultation.isDifferentStartTimes}
                onCheckedChange={setConsultPerDayStartTimesEnabled}
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
                          onTimeSelect={(time) => updateConsultStart(index, time)}
                          minuteInterval={15}
                          placeholder="Select appointment time"
                          modalTitle="Choose Time"
                        />
                      </View>
                      {calendar.consultation.startTimes.length > 1 && index > 0 && (
                        <Button variant="outline" className='h-10 w-10' onPress={() => removeConsultStart(index)}>
                          <Icon as={Trash} size={20} />
                        </Button>
                      )}
                    </View>
                  ))}
                  {calendar.consultation.startTimes.length == 0 && (
                    <TimePicker
                      initialTime={defaultConsultInitialTime}
                      onTimeSelect={addConsultStart}
                      minuteInterval={15}
                      placeholder="Select appointment time"
                      modalTitle="Choose Time"
                    />)}
                  <Button variant="outline" onPress={() => addConsultStart(new Date())}>
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
                          {dayStartTimes.length == 0 && (
                            <TimePicker
                              initialTime={defaultConsultInitialTime}
                              onTimeSelect={(time) => addConsultStartForDay(day, time)}
                              minuteInterval={15}
                              placeholder="Select appointment time"
                              modalTitle={`Choose ${day} Time`}
                            />)}
                          <Button variant="outline" onPress={() => addConsultStartForDay(day, new Date())}>
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
