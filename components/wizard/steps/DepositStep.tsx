import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { depositTimesChunks, timesChunks } from '@/components/pages/your-rule/type';

export function DepositStep() {

    const { deposit, updateDeposit } = useSetupWizard();

    return (
        <KeyboardAwareScrollView bottomOffset={80} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
            <View className="gap-6 pb-4">
                <View className="items-center justify-center pb-2">
                    <Image
                        source={require('@/assets/images/icons/deposit.png')}
                        style={{ width: 56, height: 56 }}
                        resizeMode="contain"
                    />
                    <Text variant="h6" className="text-center uppercase">Deposit</Text>
                    <Text variant="h6" className="text-center uppercase leading-none">RULES</Text>
                    <Text className="text-center mt-2 text-text-secondary">Stop chasing deposits by setting </Text>
                    <Text className="text-center text-text-secondary">boundaries here</Text>
                </View>
                <View className="gap-6">
                    <View className="flex-row w-full gap-4 justify-between">
                        <View className='flex-1 gap-2 max-w-[240px]'>
                            <Text variant="h5" className='leading-none'>Standard deposit amount</Text>
                            <Text className='text-text-secondary'>You can change  this  per project,  so don't worry</Text>
                        </View>
                        <View className='w-20'>
                            <Input
                                placeholder="500"
                                value={deposit.amount} 
                                onChangeText={(text) => updateDeposit({ amount: text })} />
                        </View>
                    </View>

                    <View className='gap-2'>
                        <Text variant="h5">Default Hold Time hrs/days</Text>
                        <RadioGroup value={deposit.holdTime} onValueChange={(value) => updateDeposit({ holdTime: value })}>
                            {depositTimesChunks.map((times) => (
                                <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                    {times.map((time) => (
                                        <Pressable onPress={() => updateDeposit({ holdTime: time.value })} key={time.value} className="flex-1 flex-row items-center gap-3">
                                            <RadioGroupItem value={time.value} id={time.value} className={deposit.holdTime === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                            <Text>
                                                {time.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            ))}
                        </RadioGroup>
                        <Text className='text-text-secondary'>If the deposit isn't paid in time, held dates are released.</Text>
                    </View>

                    <View className='gap-2'>
                        <Text variant="h5">Deposit Reminder</Text>
                        <RadioGroup value={deposit.remindTime} onValueChange={(value) => updateDeposit({ remindTime: value })}>
                            {timesChunks.map((times) => (
                                <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                    {times.map((time) => (
                                        <Pressable onPress={() => updateDeposit({ remindTime: time.value })} key={time.value} className="flex-1 flex-row items-center gap-3">
                                            <RadioGroupItem value={time.value} id={time.value} className={deposit.remindTime === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                            <Text>
                                                {time.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            ))}
                        </RadioGroup>
                        <Text className='text-text-secondary'>Deposit payment reminder sent out after {deposit.remindTime} hours</Text>
                    </View>

                    <View className='gap-2'>
                        <Text variant="h5">Deposit Policy</Text>
                        <Textarea placeholder="Type your message here." className='min-h-28' value={deposit.policy} onChangeText={(text) => updateDeposit({ policy: text })} />
                    </View>

                    <View className='gap-2'>
                        <Text variant="h5">Cancellation Policy</Text>
                        <Textarea placeholder="Type your message here." className='min-h-28' value={deposit.cancellationPolicy} onChangeText={(text) => updateDeposit({ cancellationPolicy: text })} />
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
    )
}