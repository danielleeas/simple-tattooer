import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Pressable, Image } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/lib/time-picker';
import { useToast } from "@/lib/contexts/toast-context";
import { DurationPicker } from "@/components/lib/duration-picker";
import { useAuth } from '@/lib/contexts/auth-context';
import { EventBlockTimeRecord, getEventBlockTimeById, updateEventBlockTime, UpdateEventBlockTimeInput } from '@/lib/services/calendar-service';
import { convertTimeToISOString, convertTimeToHHMMString, parseYmdFromDb } from "@/lib/utils";
import { Collapse } from "@/components/lib/collapse";

import X_IMAGE from "@/assets/images/icons/x.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";

type EventBlockTimeData = {
    id: string;
    date: string;
    title: string;
    startTime?: string;
    endTime?: string;
    isRepeat: boolean;
    repeatLength?: number;
    repeatUnit?: 'days' | 'weeks' | 'months' | 'years';
    eventNotes: string;
};

const repeatDuration = (length?: number, unit?: 'days' | 'weeks' | 'months' | 'years'): { value: number; unit: 'days' | 'weeks' | 'months' | 'years' } | undefined => {
    if (!length || !unit) return undefined;
    if (length <= 0) return undefined;
    return { value: length, unit };
};

const getRepeatType = (unit?: 'days' | 'weeks' | 'months' | 'years'): 'daily' | 'weekly' | 'monthly' | 'yearly' => {
    if (!unit) return 'daily';
    if (unit === 'days') return 'daily';
    if (unit === 'weeks') return 'weekly';
    if (unit === 'months') return 'monthly';
    if (unit === 'years') return 'yearly';
    return 'daily';
};

export default function AddEventBlockTimePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { artist } = useAuth();
    const [loading, setLoading] = useState(false);
    const { id } = useLocalSearchParams<{ id: string }>();
    const [event, setEvent] = useState<EventBlockTimeRecord | null>(null);
    const [formData, setFormData] = useState<EventBlockTimeData>({
        id: '',
        date: '',
        title: '',
        startTime: '',
        endTime: '',
        isRepeat: false,
        repeatLength: undefined,
        repeatUnit: undefined,
        eventNotes: '',
    });

    const hasChanges = useMemo(() => {
        if (!event) return false;
        return JSON.stringify(formData) !== JSON.stringify(event);
    }, [formData, event]);

    const loadEvent = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getEventBlockTimeById(id);
            if (res.success && res.data) {
                setEvent(res.data);
            } else {
                setEvent(null);
            }
        } catch (e) {
            setEvent(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadEvent();
        }
    }, [id]);

    useEffect(() => {
        if (event) {
            setFormData({
                id: event.id,
                date: event.date,
                title: event.title,
                startTime: event.start_time,
                endTime: event.end_time,
                isRepeat: event.repeatable,
                repeatLength: event.repeat_duration ?? undefined,
                repeatUnit: event.repeat_duration_unit ?? undefined,
                eventNotes: event.notes ?? '',
            });
        }
    }, [event]);

    const handleBack = () => {
        router.back();
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (!artist?.id) {
                toast({ variant: 'error', title: 'Not authenticated', duration: 2500 });
                return;
            }

            if (!formData.title.trim()) {
                toast({ variant: 'error', title: 'Title is required', duration: 2500 });
                return;
            }

            if (!formData.startTime || !formData.endTime) {
                toast({ variant: 'error', title: 'Start and End time are required', duration: 2500 });
                return;
            }

            const data: UpdateEventBlockTimeInput = {
                id: formData.id,
                date: formData.date ?? undefined,
                title: formData.title.trim(),
                start_time: formData.startTime,
                end_time: formData.endTime,
                repeatable: formData.isRepeat,
                repeat_type: getRepeatType(formData.repeatUnit),
                repeat_duration: formData.repeatLength ?? undefined,
                repeat_duration_unit: formData.repeatUnit as 'days' | 'weeks' | 'months' | 'years' | undefined,
                notes: formData.eventNotes ?? undefined,
            };

            const result = await updateEventBlockTime(id, data);
            if (!result.success) {
                console.log(result)
                toast({ variant: 'error', title: result.error || 'Failed to save event', duration: 3000 });
                return;
            }

            toast({ variant: 'success', title: 'Event Updated!', duration: 3000 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        } catch (e) {
            console.log(e)
            toast({ variant: 'error', title: e instanceof Error ? e.message : 'Unexpected error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={X_IMAGE}
                    onLeftButtonPress={handleBack}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4 pt-2 pb-8">
                        <KeyboardAwareScrollView
                            bottomOffset={50}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View className="gap-6 pb-6">
                                <View className="items-center justify-center pb-9">
                                    <Image
                                        source={APPOINTMENT_IMAGE}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Edit Event/</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Block Time</Text>
                                </View>

                                {/* Form Fields */}
                                <View className="gap-6">
                                    {/* Event Name */}
                                    <View className="gap-2">
                                        <Text variant="h5">Title</Text>
                                        <Input
                                            placeholder="Enter title"
                                            value={formData.title}
                                            onChangeText={(text) => setFormData({ ...formData, title: text })}
                                            className="w-full"
                                        />
                                    </View>

                                    <View className="gap-6">
                                        <View className="items-start gap-2">
                                            <Collapse title="Start Time" textClassName="text-xl">
                                                <View className="gap-2 w-full">
                                                    <TimePicker
                                                        minuteInterval={15}
                                                        className="w-full"
                                                        selectedTime={formData.startTime ? convertTimeToISOString(formData.startTime) : undefined}
                                                        onTimeSelect={(time) => setFormData({ ...formData, startTime: convertTimeToHHMMString(time) })}
                                                    />
                                                </View>
                                            </Collapse>
                                        </View>
                                        <View className="items-start gap-2">
                                            <Collapse title="End Time" textClassName="text-xl">
                                                <View className="gap-2 w-full">
                                                    <TimePicker
                                                        minuteInterval={15}
                                                        className="w-full"
                                                        selectedTime={formData.endTime ? convertTimeToISOString(formData.endTime) : undefined}
                                                        onTimeSelect={(time) => setFormData({ ...formData, endTime: convertTimeToHHMMString(time) })}
                                                    />
                                                </View>
                                            </Collapse>
                                        </View>
                                    </View>

                                    <View className="gap-2">
                                        <View className="flex-row items-start gap-1">
                                            <Pressable className="flex-1 gap-2" onPress={() => setFormData({ ...formData, isRepeat: !formData.isRepeat })}>
                                                <Text variant="h5" className="w-[310px]">Repeat?</Text>
                                            </Pressable>
                                            <View>
                                                <Switch
                                                    checked={formData.isRepeat}
                                                    onCheckedChange={() => setFormData({ ...formData, isRepeat: !formData.isRepeat })}
                                                />
                                            </View>
                                        </View>

                                    </View>

                                    {formData.isRepeat && (
                                        <View className="gap-2">
                                            <Collapse title="How long do you want this to repeat for?" textClassName="text-xl">
                                                <View className="gap-2 w-full">
                                                    <DurationPicker
                                                        selectedDuration={repeatDuration(formData.repeatLength ?? undefined, formData.repeatUnit ?? undefined)}
                                                        onDurationSelect={(duration) => setFormData({ ...formData, repeatLength: duration?.value, repeatUnit: duration?.unit as 'days' | 'weeks' | 'months' | 'years' })}
                                                        maxValue={12}
                                                        modalTitle="Select Repeat Duration"
                                                    />
                                                </View>
                                            </Collapse>
                                        </View>
                                    )}

                                    <View className="gap-2">
                                        <Text variant="h5">Notes</Text>
                                        <Textarea
                                            placeholder="Project Notes"
                                            className="min-h-28"
                                            value={formData.eventNotes || ''}
                                            onChangeText={(text) => setFormData({ ...formData, eventNotes: text })}
                                        />
                                    </View>
                                </View>

                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Button onPress={handleCancel} size="lg" variant="outline" disabled={loading}>
                                            <Text variant='h5'>Cancel</Text>
                                        </Button>
                                    </View>

                                    <View className="flex-1">
                                        <Button onPress={handleSave} size="lg" disabled={loading || !hasChanges}>
                                            <Text variant='h5'>{loading ? 'Saving...' : 'Save'}</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper >
            </SafeAreaView >
        </>
    );
}
