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

export default function AddEventBlockTimePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { artist } = useAuth();
    const [loading, setLoading] = useState(false);
    const { id } = useLocalSearchParams<{ id: string }>();
    const [event, setEvent] = useState<EventBlockTimeRecord | null>(null);
    const [formData, setFormData] = useState<EventBlockTimeRecord>({
        id: '',
        artist_id: '',
        title: '',
        date: '',
        start_time: '',
        end_time: '',
        repeatable: false,
        repeat_type: 'daily',
        repeat_duration: 1,
        repeat_duration_unit: 'weeks',
        notes: '',
        off_booking_enabled: false,
        off_booking_repeatable: false,
        off_booking_repeat_type: 'daily',
        off_booking_repeat_duration: 1,
        off_booking_repeat_duration_unit: 'weeks',
        off_booking_notes: ''
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
            setFormData(event);
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

            if (!formData.start_time || !formData.end_time) {
                toast({ variant: 'error', title: 'Start and End time are required', duration: 2500 });
                return;
            }

            // Derive YYYY-MM-DD directly from the input without timezone conversions
            const dateStr = (() => {
                const pad = (n: number) => String(n).padStart(2, '0');
                if (formData?.date) {
                    try {
                        const d = parseYmdFromDb(String(formData.date));
                        if (!isNaN(d.getTime())) {
                            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                        }
                    } catch { /* noop */ }
                    // Fallback: if string starts with YYYY-MM-DD, take that portion
                    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(formData.date));
                    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
                }
                const now = new Date();
                return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
            })();

            const data: UpdateEventBlockTimeInput = {
                ...formData,
                date: dateStr,
                notes: formData.notes ?? undefined,
                off_booking_notes: formData.off_booking_notes ?? undefined,
            };

            const result = await updateEventBlockTime(id, data);
            if (!result.success) {
                console.log(result)
                toast({ variant: 'error', title: result.error || 'Failed to save event', duration: 3000 });
                return;
            }

            toast({ variant: 'success', title: 'Event Updated!', duration: 3000 });
            router.back();
        } catch (e) {
            console.log(e)
            toast({ variant: 'error', title: e instanceof Error ? e.message : 'Unexpected error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
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
                                                        selectedTime={formData.start_time ? convertTimeToISOString(formData.start_time) : undefined}
                                                        onTimeSelect={(time) => setFormData({ ...formData, start_time: convertTimeToHHMMString(time) })}
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
                                                        selectedTime={formData.end_time ? convertTimeToISOString(formData.end_time) : undefined}
                                                        onTimeSelect={(time) => setFormData({ ...formData, end_time: convertTimeToHHMMString(time) })}
                                                    />
                                                </View>
                                            </Collapse>
                                        </View>
                                    </View>

                                    <View className="gap-2">
                                        <View className="flex-row items-start gap-1">
                                            <Pressable className="flex-1 gap-2" onPress={() => setFormData({ ...formData, repeatable: !formData.repeatable })}>
                                                <Text variant="h5" className="w-[310px]">Repeat?</Text>
                                            </Pressable>
                                            <View>
                                                <Switch
                                                    checked={formData.repeatable}
                                                    onCheckedChange={() => setFormData({ ...formData, repeatable: !formData.repeatable })}
                                                />
                                            </View>
                                        </View>

                                        {formData.repeatable && (
                                            <View className="gap-2">
                                                <View className="flex-row items-center gap-2">
                                                    <Button onPress={() => setFormData({ ...formData, repeat_type: 'daily' })} variant={formData.repeat_type === 'daily' ? 'default' : 'outline'} className="w-[78px] h-8 items-center justify-center px-0 py-0">
                                                        <Text variant='small'>Daily</Text>
                                                    </Button>
                                                    <Button onPress={() => setFormData({ ...formData, repeat_type: 'weekly' })} variant={formData.repeat_type === 'weekly' ? 'default' : 'outline'} className="w-[78px] h-8 items-center justify-center px-0 py-0">
                                                        <Text variant='small'>Weekly</Text>
                                                    </Button>
                                                    <Button onPress={() => setFormData({ ...formData, repeat_type: 'monthly' })} variant={formData.repeat_type === 'monthly' ? 'default' : 'outline'} className="w-[78px] h-8 items-center justify-center px-0 py-0">
                                                        <Text variant='small'>Monthly</Text>
                                                    </Button>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {formData.repeatable && (
                                        <View className="gap-2">
                                            <Collapse title="How long do you want this to repeat for?" textClassName="text-xl">
                                                <View className="gap-2 w-full">
                                                    <DurationPicker
                                                        selectedDuration={formData.repeat_duration != null && !!formData.repeat_duration_unit
                                                            ? { value: formData.repeat_duration, unit: formData.repeat_duration_unit }
                                                            : undefined}
                                                        onDurationSelect={(duration) => setFormData({ ...formData, repeat_duration: duration.value, repeat_duration_unit: duration.unit })}
                                                        maxValue={12}
                                                        modalTitle="Select Repeat Duration"
                                                        disabledUnits={formData.repeat_type === 'monthly' ? ['weeks'] : undefined}
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
                                            value={formData.notes || ''}
                                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                                        />
                                    </View>
                                </View>

                                <View className="flex-row items-start gap-4">
                                    <View className="h-6 w-6 rounded-xl bg-blue-500" />
                                    <Text variant="h4" className="leading-8 flex-1">Mark Day as Unavailable</Text>
                                </View>

                                <View className="gap-6">
                                    <View className="flex-row items-start gap-1">
                                        <Pressable className="flex-1 gap-2" onPress={() => setFormData({ ...formData, off_booking_enabled: !formData.off_booking_enabled })}>
                                            <Text variant="h5" className="w-[310px]">Turn off auto-booking and consults for the day?</Text>
                                        </Pressable>
                                        <View>
                                            <Switch
                                                checked={formData.off_booking_enabled}
                                                onCheckedChange={() => setFormData({ ...formData, off_booking_enabled: !formData.off_booking_enabled })}
                                            />
                                        </View>
                                    </View>

                                    <View className="gap-2">
                                        <View className="flex-row items-start gap-1">
                                            <Pressable className="flex-1 gap-2" onPress={() => setFormData({ ...formData, off_booking_repeatable: !formData.off_booking_repeatable })}>
                                                <Text variant="h5" className="w-[310px]">Repeat?</Text>
                                            </Pressable>
                                            <View>
                                                <Switch
                                                    checked={!!formData.off_booking_repeatable}
                                                    onCheckedChange={() => setFormData({ ...formData, off_booking_repeatable: !formData.off_booking_repeatable })}
                                                />
                                            </View>
                                        </View>

                                        {formData.off_booking_repeatable && (
                                            <View className="gap-2">
                                                <View className="flex-row items-center gap-2">
                                                    <Button onPress={() => setFormData({ ...formData, off_booking_repeat_type: 'daily' })} variant={formData.off_booking_repeat_type === 'daily' ? 'default' : 'outline'} className="w-[78px] h-8 items-center justify-center px-0 py-0">
                                                        <Text variant='small'>Daily</Text>
                                                    </Button>
                                                    <Button onPress={() => setFormData({ ...formData, off_booking_repeat_type: 'weekly' })} variant={formData.off_booking_repeat_type === 'weekly' ? 'default' : 'outline'} className="w-[78px] h-8 items-center justify-center px-0 py-0">
                                                        <Text variant='small'>Weekly</Text>
                                                    </Button>
                                                    <Button onPress={() => setFormData({ ...formData, off_booking_repeat_type: 'monthly' })} variant={formData.off_booking_repeat_type === 'monthly' ? 'default' : 'outline'} className="w-[78px] h-8 items-center justify-center px-0 py-0">
                                                        <Text variant='small'>Monthly</Text>
                                                    </Button>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {formData.off_booking_repeatable && (
                                        <View className="gap-2">
                                            <Collapse title="How long do you want this to repeat for?">
                                                <View className="gap-2 w-full">
                                                    <DurationPicker
                                                        selectedDuration={formData.off_booking_repeat_duration != null && !!formData.off_booking_repeat_duration_unit
                                                            ? { value: formData.off_booking_repeat_duration, unit: formData.off_booking_repeat_duration_unit }
                                                            : undefined}
                                                        onDurationSelect={(duration) => setFormData({ ...formData, off_booking_repeat_duration: duration.value, off_booking_repeat_duration_unit: duration.unit })}
                                                        maxValue={12}
                                                        modalTitle="Select Repeat Duration"
                                                        disabledUnits={formData.off_booking_repeat_type === 'monthly' ? ['weeks'] : undefined}
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
                                            value={formData.off_booking_notes || ''}
                                            onChangeText={(text) => setFormData({ ...formData, off_booking_notes: text })}
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
