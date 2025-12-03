import { useEffect, useState } from "react";
import { Pressable, View, Image } from "react-native"
import { Text } from "@/components/ui/text";
import { Collapse } from "@/components/lib/collapse";
import { DrawingDataProps, reviewAdvanceTimeChunks, timesChunks, dayChunks } from "./type";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

interface DrawingProps {
    drawingData: DrawingDataProps;
    updateDrawingData: (updates: Partial<DrawingDataProps>) => void;
}

export const Drawing = ({ drawingData, updateDrawingData }: DrawingProps) => {
    return (
        <View className="gap-6 mt-4">
            <View className="flex-row items-start gap-2">
                <Pressable className="flex-1 gap-2" onPress={() => updateDrawingData({ sendDrawingsInAdvance: !drawingData.sendDrawingsInAdvance })}>
                    <Text className="text-xl leading-6">
                        Do you send drawings in advance?
                    </Text>
                    <Text className="text-text-secondary leading-5">If yes, your drawing will be sent with your final appointment reminder.</Text>
                </Pressable>
                <Switch
                    checked={drawingData.sendDrawingsInAdvance || false}
                    onCheckedChange={(checked) => updateDrawingData({ sendDrawingsInAdvance: checked })}
                />
            </View>

            {drawingData.sendDrawingsInAdvance ? (
                <View className="gap-4">
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
                        <RadioGroup value={drawingData.receiveDrawingTime?.toString() || '24'} onValueChange={(value) => updateDrawingData({ receiveDrawingTime: parseInt(value) })}>
                            {reviewAdvanceTimeChunks.map((times) => (
                                <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                    {times.map((time) => (
                                        <Pressable onPress={() => updateDrawingData({ receiveDrawingTime: parseInt(time.value) })} key={time.value} className="flex-1 h-6 flex-row items-center gap-3">
                                            <RadioGroupItem value={time.value} id={time.value} className={drawingData.receiveDrawingTime?.toString() === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                            <Text>
                                                {time.label}
                                            </Text>
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
                        <RadioGroup value={drawingData.changePolicyTime?.toString() || '24'} onValueChange={(value) => updateDrawingData({ changePolicyTime: parseInt(value) })}>
                            {timesChunks.map((times) => (
                                <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                    {times.map((time) => (
                                        <Pressable onPress={() => updateDrawingData({ changePolicyTime: parseInt(time.value) })} key={time.value} className="flex-1 h-6 flex-row items-center gap-3">
                                            <RadioGroupItem value={time.value} id={time.value} className={drawingData.changePolicyTime?.toString() === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                            <Text>
                                                {time.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            ))}
                        </RadioGroup>
                    </View>
                </View>
            ) : (
                <View className="items-start gap-2">
                    <Collapse title="Final Appointment Reminder" textClassName="text-xl" description="For artists who DONT send drawings in advance">
                        <View className="gap-2 w-full">
                            <RadioGroup value={drawingData.finalAppointmentRemindTime?.toString() || '24'} onValueChange={(value) => updateDrawingData({ finalAppointmentRemindTime: parseInt(value) })}>
                                {reviewAdvanceTimeChunks.map((times) => (
                                    <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                        {times.map((time) => (
                                            <Pressable onPress={() => updateDrawingData({ finalAppointmentRemindTime: parseInt(time.value) })} key={time.value} className="flex-1 h-6 flex-row items-center gap-3">
                                                <RadioGroupItem value={time.value} id={time.value} className={drawingData.finalAppointmentRemindTime?.toString() === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                                <Text>
                                                    {time.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                ))}
                            </RadioGroup>
                        </View>
                    </Collapse>
                </View>
            )}

            <View className="flex-row items-start gap-2">
                <Pressable onPress={() => updateDrawingData({ autoEmail: !drawingData.autoEmail })} className="flex-1 gap-2">
                    <Text className="text-xl leading-5">
                        Auto Cancellation List
                    </Text>
                    <Text className="text-text-secondary leading-5">The system will automatically email your cancellation list for you</Text>
                </Pressable>
                <Switch
                    checked={drawingData.autoEmail || false}
                    onCheckedChange={(checked) => updateDrawingData({ autoEmail: checked })}
                />
            </View>

            <View className="flex-row items-start gap-2">
                <Pressable onPress={() => updateDrawingData({ autoFillDrawing: !drawingData.autoFillDrawing })} className="flex-1 gap-2">
                    <Text className="text-xl leading-5">
                        Auto-Fill Drawing Check
                    </Text>
                    <Text className="text-text-secondary leading-5">The system will only choose clients with finished drawings.</Text>
                </Pressable>
                <Switch
                    checked={drawingData.autoFillDrawing || false}
                    onCheckedChange={(checked) => updateDrawingData({ autoFillDrawing: checked })}
                />
            </View>

            <View className="flex-row w-full gap-4 items-center">
                <View className='flex-1 gap-2'>
                    <Text variant="h5">Maximum Reschedules  Allowed</Text>
                </View>
                <View className='w-20'>
                    <Input
                        keyboardType="number-pad"
                        inputMode="numeric"
                        placeholder="0"
                        className="h-8"
                        value={drawingData.maxReschedulesAllowed.toString()}
                        onChangeText={(text) => updateDrawingData({ maxReschedulesAllowed: text })}
                    />
                </View>
            </View>

            <View className='gap-2'>
                <View className='gap-2 justify-between'>
                    <Text variant="h5">Reschedule Booking Window</Text>
                    <Text className="text-text-secondary">How far from their rescheduled appointment (or your next availability) can clients book</Text>
                </View>
                <RadioGroup value={drawingData.rescheduleBookingDays?.toString() || '14'} onValueChange={(value) => updateDrawingData({ rescheduleBookingDays: parseInt(value) })}>
                    {dayChunks.map((times) => (
                        <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                            {times.map((time) => (
                                <Pressable onPress={() => updateDrawingData({ rescheduleBookingDays: parseInt(time.value) })} key={time.value} className="flex-1 h-6 flex-row items-center gap-3">
                                    <RadioGroupItem value={time.value} id={time.value} className={drawingData.rescheduleBookingDays?.toString() === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                    <Text>
                                        {time.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    ))}
                </RadioGroup>
            </View>
        </View>
    )
}