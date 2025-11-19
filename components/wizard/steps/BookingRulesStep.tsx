import React, { useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { TimeDurationPicker } from '@/components/lib/time-duration-picker';
import { Note } from '@/components/ui/note';

export function BookingRulesStep() {

    const { bookingRules, updateBookingRules } = useSetupWizard();
    const [sessionColOpened, setSessionColOpened] = useState(true);
    const [sessionDurationColOpened, setSessionDurationColOpened] = useState(true);

    return (
        <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false}>
            <View className="gap-6 pb-4">
                <View className="items-center justify-center pb-2">
                    <Image
                        source={require('@/assets/images/icons/booking_form.png')}
                        style={{ width: 56, height: 56 }}
                        resizeMode="contain"
                    />
                    <Text variant="h6" className="text-center uppercase">SET BOOKING</Text>
                    <Text variant="h6" className="text-center uppercase leading-none">RULES</Text>
                    <Text className="text-center mt-2 text-text-secondary">Set how your days are structured. You can</Text>
                    <Text className="text-center text-text-secondary">update this later anytime in settings. </Text>
                </View>
                <View className="gap-6">
                    <View className="flex-row items-start gap-2">
                        <Pressable className="flex-1 gap-2" onPress={() => updateBookingRules({ moreThanOne: { ...bookingRules.moreThanOne, isMoreOne: !bookingRules.moreThanOne.isMoreOne } })}>
                            <Text className="text-xl leading-6">
                                Do you tattoo more than one session per day?
                            </Text>
                            <Text className="text-text-secondary leading-5">If  yes, you'll be able to set up your days here</Text>
                        </Pressable>
                        <Switch
                            checked={bookingRules.moreThanOne.isMoreOne}
                            onCheckedChange={(checked) => updateBookingRules({ moreThanOne: { ...bookingRules.moreThanOne, isMoreOne: checked } })}
                        />
                    </View>

                    {bookingRules.moreThanOne.isMoreOne && (
                        <>
                            <View className="flex-row w-full gap-4 items-center">
                                <View className='flex-1 gap-2'>
                                    <Text variant="h5">How many sessions per day?</Text>
                                </View>
                                <View className='w-20'>
                                    <Input
                                        value={bookingRules.moreThanOne.sessionCount.toString()}
                                        onChangeText={(text) => {
                                            const num = parseInt(text);
                                            if (text === '' || isNaN(num)) {
                                                // Don't update if empty or invalid
                                                if (text === '') {
                                                    updateBookingRules({ moreThanOne: { ...bookingRules.moreThanOne, sessionCount: 0 } });
                                                }
                                                return;
                                            }
                                            updateBookingRules({ moreThanOne: { ...bookingRules.moreThanOne, sessionCount: num } });
                                        }}
                                    />
                                </View>
                            </View>

                            <View className="items-start gap-2">
                                <Pressable className="w-full flex-row items-center justify-between" onPress={() => setSessionDurationColOpened(!sessionDurationColOpened)}>
                                    <Text variant="h5">How long is each session?</Text>
                                    <Icon as={sessionDurationColOpened ? ChevronUp : ChevronDown} size={20} />
                                </Pressable>
                                {sessionDurationColOpened && (
                                    <View className="gap-2 w-full">
                                        <TimeDurationPicker
                                            selectedDuration={bookingRules.moreThanOne.sessionDuration}
                                            onDurationSelect={(duration) => updateBookingRules({ moreThanOne: { ...bookingRules.moreThanOne, sessionDuration: duration } })}
                                            minuteInterval={15}
                                            minDuration={15}
                                            maxDuration={240} // 4 hours max
                                            modalTitle="Select Session Duration"
                                        />
                                    </View>
                                )}
                            </View>

                            <View className="gap-4">
                                <View className='flex-1 gap-1'>
                                    <Text variant="h5">Break time between sessions</Text>
                                    <Text className="text-text-secondary leading-none">Use this to space out your bookings during the day.</Text>
                                </View>
                                <View className='flex-1 w-full'>
                                    <TimeDurationPicker
                                        selectedDuration={bookingRules.moreThanOne.breakTime || 0}
                                        onDurationSelect={(duration) => updateBookingRules({ moreThanOne: { ...bookingRules.moreThanOne, breakTime: duration } })}
                                        minuteInterval={15}
                                        minDuration={15}
                                        maxDuration={240} // 4 hours max
                                        modalTitle="Select Break Duration"
                                    />
                                </View>
                            </View>
                        </>
                    )}

                    <View className="flex-row items-start gap-2">
                        <Pressable className="flex-1 gap-2" onPress={() => updateBookingRules({ backToBack: { ...bookingRules.backToBack, isBackToBack: !bookingRules.backToBack.isBackToBack } })}>
                            <Text className="text-xl leading-6">
                                Do you tattoo clients on back-to-back days??
                            </Text>
                        </Pressable>
                        <Switch
                            checked={bookingRules.backToBack.isBackToBack}
                            onCheckedChange={(checked) => updateBookingRules({ backToBack: { ...bookingRules.backToBack, isBackToBack: checked } })}
                        />
                    </View>

                    {bookingRules.backToBack.isBackToBack && (
                        <View className="flex-row w-full gap-4">
                            <View className='flex-1'>
                                <Text variant="h5">Max sessions back-to-back</Text>
                            </View>
                            <View className='w-20'>
                                <Input
                                    value={bookingRules.backToBack.maxSessions.toString()}
                                    onChangeText={(text) => {
                                        const num = parseInt(text);
                                        if (text === '' || isNaN(num)) {
                                            // Don't update if empty or invalid
                                            if (text === '') {
                                                updateBookingRules({ backToBack: { ...bookingRules.backToBack, maxSessions: 0 } });
                                            }
                                            return;
                                        }
                                        updateBookingRules({ backToBack: { ...bookingRules.backToBack, maxSessions: num } });
                                    }}
                                />
                            </View>
                        </View>
                    )}

                    <View className="flex-row w-full gap-4">
                        <View className='flex-1'>
                            <Text variant="h5">Buffer between sessions</Text>
                            <Text className="text-text-secondary">How many days in between sessions or back to back sets?</Text>
                        </View>
                        <View className='w-20'>
                            <Input
                                value={bookingRules.bufferSession.toString()}
                                onChangeText={(text) => {
                                    const num = parseInt(text);
                                    if (text === '' || isNaN(num)) {
                                        // Don't update if empty or invalid
                                        if (text === '') {
                                            updateBookingRules({ bufferSession: 0 });
                                        }
                                        return;
                                    }
                                    updateBookingRules({ bufferSession: num });
                                }}
                            />
                        </View>
                    </View>

                    <Note
                        message="You can always override this per project or block days off in your calendar later."
                    />

                </View>
            </View>
        </KeyboardAwareScrollView>
    )
}