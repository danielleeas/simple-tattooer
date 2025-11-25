import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TimeDurationPicker } from '@/components/lib/time-duration-picker';
import { Note } from '@/components/ui/note';
import { Collapse } from '@/components/lib/collapse';

export function BookingRulesStep() {

    const { bookingRules, updateBookingRules } = useSetupWizard();

    return (
        <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
            <View className="gap-6 pb-4">
                <View className="items-center justify-center pb-2">
                    <Image
                        source={require('@/assets/images/icons/booking_form.png')}
                        style={{ width: 56, height: 56 }}
                        resizeMode="contain"
                    />
                    <Text variant="h6" className="text-center uppercase">SET BOOKING</Text>
                    <Text variant="h6" className="text-center uppercase leading-none">RULES</Text>
                    <Text className="text-center mt-2 text-text-secondary leading-none" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>Set how your days are structured. You can</Text>
                    <Text className="text-center text-text-secondary" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>update this later anytime in settings. </Text>
                </View>
                <View className="gap-6">
                    <View className="flex-row items-start gap-2">
                        <Pressable className="flex-1 gap-1" onPress={() => updateBookingRules({ moreThanOne: { ...bookingRules.moreThanOne, isMoreOne: !bookingRules.moreThanOne.isMoreOne } })}>
                            <Text className="text-xl leading-6">
                                Do you tattoo more than one session per day?
                            </Text>
                            <Text className="text-text-secondary leading-none" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>If  yes, you'll be able to set up your days here</Text>
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
                                    <Text variant="h5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>How many sessions per day?</Text>
                                </View>
                                <View className='w-20'>
                                    <Input
                                        value={bookingRules.moreThanOne.sessionCount}
                                        keyboardType="number-pad"
                                        inputMode="numeric"
                                        onChangeText={(text) => updateBookingRules({ moreThanOne: { ...bookingRules.moreThanOne, sessionCount: text } })}
                                        placeholder="0"
                                    />
                                </View>
                            </View>

                            <View className="items-start gap-2">
                                <Collapse title="How long is each session?" textClassName='text-xl'>
                                    <TimeDurationPicker
                                        selectedDuration={Number(bookingRules.moreThanOne.sessionDuration) || undefined}
                                        onDurationSelect={(duration) => updateBookingRules({ moreThanOne: { ...bookingRules.moreThanOne, sessionDuration: duration.toString() } })}
                                        minuteInterval={15}
                                        minDuration={15}
                                        maxDuration={525} // 4 hours max
                                        modalTitle="Select Session Duration"
                                    />
                                </Collapse>
                            </View>

                            <View className="gap-4">
                                <View className='flex-1 gap-1'>
                                    <Text variant="h5">Break time between sessions</Text>
                                    <Text className="text-text-secondary leading-none" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>Use this to space out your bookings during the day.</Text>
                                </View>
                                <View className='flex-1 w-full'>
                                    <TimeDurationPicker
                                        selectedDuration={Number(bookingRules.moreThanOne.breakTime) || undefined}
                                        onDurationSelect={(duration) => updateBookingRules({ moreThanOne: { ...bookingRules.moreThanOne, breakTime: duration.toString() } })}
                                        minuteInterval={15}
                                        minDuration={15}
                                        maxDuration={525} // 4 hours max
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
                        <View className="flex-row w-full gap-4 items-center">
                            <View className='flex-1 gap-1'>
                                <Text variant="h5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>Max sessions back-to-back</Text>
                            </View>
                            <View className='w-20'>
                                <Input
                                    placeholder='0'
                                    value={bookingRules.backToBack.maxSessions}
                                    keyboardType="number-pad"
                                    inputMode="numeric"
                                    onChangeText={(text) => updateBookingRules({ backToBack: { ...bookingRules.backToBack, maxSessions: text } })}
                                />
                            </View>
                        </View>
                    )}

                    <View className="flex-row w-full gap-4 items-start">
                        <View className='flex-1 gap-1'>
                            <Text variant="h5">Buffer between sessions</Text>
                            <Text className="text-text-secondary leading-none">How many days in between sessions or back to back sets?</Text>
                        </View>
                        <View className='w-20'>
                            <Input
                                placeholder='0'
                                value={bookingRules.bufferSession}
                                keyboardType="number-pad"
                                inputMode="numeric"
                                onChangeText={(text) => updateBookingRules({ bufferSession: text })}
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