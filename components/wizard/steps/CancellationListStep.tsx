import React from 'react';
import { View, Image, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export function CancellationListStep() {

    const { cancellationList, updateCancellationList } = useSetupWizard();

    const dayChunks = [
        [{ value: '14', label: '14 Days' }, { value: '30', label: '30 Days' }],
        [{ value: '45', label: '45 Days' }, { value: '60', label: '60 Days' }],
    ]

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-6 pb-4">
                <View className="items-center justify-center pb-2">
                    <Image
                        source={require('@/assets/images/icons/rules.png')}
                        style={{ width: 56, height: 56 }}
                        resizeMode="contain"
                    />
                    <Text variant="h6" className="text-center uppercase">cancellation</Text>
                    <Text variant="h6" className="text-center uppercase leading-none">list</Text>
                    <Text className="text-center mt-2 text-text-secondary">Let the system fill your gaps (or don't)</Text>
                </View>
                <View className="gap-6">
                    <View className="flex-row items-start gap-2">
                        <Pressable className="flex-1 gap-2" onPress={() => updateCancellationList({ isAutoEmail: !cancellationList.isAutoEmail })}>
                            <Text className="text-xl leading-5">
                                Auto-Cancellation List
                            </Text>
                            <Text className="text-text-secondary leading-5">The system will automatically email your cancellation list for you</Text>
                        </Pressable>
                        <Switch
                            checked={cancellationList.isAutoEmail}
                            onCheckedChange={(checked) => updateCancellationList({ isAutoEmail: checked })}
                        />
                    </View>

                    <View className="flex-row items-start gap-2">
                        <Pressable className="flex-1 gap-2" onPress={() => updateCancellationList({ isAutoFillDrawing: !cancellationList.isAutoFillDrawing })}>
                            <Text className="text-xl leading-5">
                                Auto-Fill Drawing Check
                            </Text>
                            <Text className="text-text-secondary leading-5">The system will only choose clients with finished drawings.</Text>
                        </Pressable>
                        <Switch
                            checked={cancellationList.isAutoFillDrawing}
                            onCheckedChange={(checked) => updateCancellationList({ isAutoFillDrawing: checked })}
                        />
                    </View>

                    <View className="flex-row w-full gap-4 items-center">
                        <View className='flex-1 gap-2'>
                            <Text variant="h5">Maximum Reschedules  Allowed</Text>
                        </View>
                        <View className='w-20'>
                            <Input
                                className="h-8"
                                value={cancellationList.maxReschedulesAllowed}
                                keyboardType="number-pad"
                                inputMode="numeric"
                                onChangeText={(text) => updateCancellationList({ maxReschedulesAllowed: text })}
                                placeholder='0'
                            />
                        </View>
                    </View>

                    <View className="items-start gap-2">
                        <View className="w-full flex-row items-center justify-between" >
                            <Text variant="h5">Reschedule Booking Window</Text>
                        </View>
                        <Text className="text-text-secondary">How far from their rescheduled appointment (or your next availability) can clients book</Text>
                        <View className="flex-1 gap-2 w-full">
                            <RadioGroup value={cancellationList.rescheduleTime} onValueChange={(value) => updateCancellationList({ rescheduleTime: value })}>
                                {dayChunks.map((times) => (
                                    <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                        {times.map((time) => (
                                            <Pressable key={time.value} className="flex-1 h-6 flex-row items-center gap-3" onPress={() => updateCancellationList({ rescheduleTime: time.value })}>
                                                <RadioGroupItem value={time.value} id={time.value} className={cancellationList.rescheduleTime === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                                <Text>{time.label}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                ))}
                            </RadioGroup>
                        </View>
                    </View>

                </View>
            </View>
        </ScrollView>
    )
}