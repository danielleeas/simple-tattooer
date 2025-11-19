import React, { useState } from 'react';
import { View, Image, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { Note } from '@/components/ui/note';

export function DrawingRulesStep() {

    const { drawingRules, updateDrawingRules } = useSetupWizard();
    const [remindTimeColOpened, setRemindTimeColOpened] = useState(false);

    const timesChunks = [
        [{ value: '2', label: 'Morning of' }, { value: '4', label: '4 Hours' }],
        [{ value: '8', label: '8 Hours' }, { value: '12', label: '12 Hours' }],
        [{ value: '24', label: '24 Hours' }, { value: '48', label: '48 Hours' }],
        [{ value: '72', label: '3 Days' }, { value: '96', label: '7 Days' }],
    ]

    const changePolicyTimeChunks = [
        [{ value: '12', label: '12 Hours' }, { value: '24', label: '24 Hours' }],
        [{ value: '48', label: '48 Hours' }, { value: '72', label: '72 Hours' }],
    ]

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-6 pb-4">
                <View className="items-center justify-center pb-2">
                    <Image
                        source={require('@/assets/images/icons/drawings.png')}
                        style={{ width: 56, height: 56 }}
                        resizeMode="contain"
                    />
                    <Text variant="h6" className="text-center uppercase">Set Drawing</Text>
                    <Text variant="h6" className="text-center uppercase leading-none">RULES</Text>
                    <Text className="text-center mt-2 text-text-secondary">Send drawings early… or keep it a surprise.</Text>
                    <Text className="text-center text-text-secondary">Whatever suits you.</Text>
                </View>
                <View className="gap-6">
                    <View className="flex-row items-start gap-2">
                        <Pressable className="flex-1 gap-2" onPress={() => updateDrawingRules({ isDrawingAdvance: !drawingRules.isDrawingAdvance })}>
                            <Text className="text-xl leading-5">
                                Do you send drawings in advance?
                            </Text>
                            <Text className="text-text-secondary leading-5">If yes, your drawing will be sent with your final appointment reminder.</Text>
                        </Pressable>
                        <Switch
                            checked={drawingRules.isDrawingAdvance}
                            onCheckedChange={(checked) => updateDrawingRules({ isDrawingAdvance: checked })}
                        />
                    </View>

                    {drawingRules.isDrawingAdvance && (
                        <>
                            <View className='gap-2'>
                                <View className='flex-row items-center gap-2 justify-between'>
                                    <View>
                                        <Image
                                            source={require('@/assets/images/icons/drawings.png')}
                                            style={{ width: 32, height: 32 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text variant="h5">When should clients receive their drawing for review?</Text>
                                </View>
                                <RadioGroup value={drawingRules.reviewAdvanceTime} onValueChange={(value) => updateDrawingRules({ reviewAdvanceTime: value })}>
                                    {timesChunks.map((times) => (
                                        <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                            {times.map((time) => (
                                                <Pressable key={time.value} className="flex-1 h-6 flex-row items-center gap-3" onPress={() => updateDrawingRules({ reviewAdvanceTime: time.value })}>
                                                    <RadioGroupItem value={time.value} id={time.value} className={drawingRules.reviewAdvanceTime === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                                    <Text>{time.label}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    ))}
                                </RadioGroup>
                            </View>

                            <View className='gap-2'>
                                <View className='flex-row items-center gap-2'>
                                    <View>
                                        <Image
                                            source={require('@/assets/images/icons/drawing_changes.png')}
                                            style={{ width: 32, height: 32 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text variant="h5">Drawing Change Policy</Text>
                                </View>
                                <RadioGroup value={drawingRules.changePolicyTime} onValueChange={(value) => updateDrawingRules({ changePolicyTime: value })}>
                                    {changePolicyTimeChunks.map((times) => (
                                        <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                            {times.map((time) => (
                                                <Pressable key={time.value} className="flex-1 h-6 flex-row items-center gap-3" onPress={() => updateDrawingRules({ changePolicyTime: time.value })}>
                                                    <RadioGroupItem value={time.value} id={time.value} className={drawingRules.changePolicyTime === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                                    <Text>{time.label}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    ))}
                                </RadioGroup>
                            </View>

                            <Note
                                message="This deadline is shown to clients but not auto-enforced. You decide on late requests."
                            />
                        </>
                    )}

                    <View className="items-start gap-2">
                        <Pressable className="w-full flex-row items-center justify-between" onPress={() => setRemindTimeColOpened(!remindTimeColOpened)}>
                            <Text variant="h5">Final Appointment Reminder</Text>
                            <Icon as={remindTimeColOpened ? ChevronUp : ChevronDown} size={20} />
                        </Pressable>
                        <Text className="text-text-secondary">For artists who DONT send drawings in advance</Text>
                        {remindTimeColOpened && (
                            <View className="flex-1 gap-2 w-full">
                                <RadioGroup value={drawingRules.finalAppointmentRemindTime} onValueChange={(value) => updateDrawingRules({ finalAppointmentRemindTime: value })}>
                                    {timesChunks.map((times) => (
                                        <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                            {times.map((time) => (
                                                <Pressable key={time.value} className="flex-1 h-6 flex-row items-center gap-3" onPress={() => updateDrawingRules({ finalAppointmentRemindTime: time.value })}>
                                                    <RadioGroupItem value={time.value} id={time.value} className={drawingRules.finalAppointmentRemindTime === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                                    <Text>{time.label}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    ))}
                                </RadioGroup>
                            </View>
                        )}
                    </View>

                </View>
            </View>
        </ScrollView>
    )
}