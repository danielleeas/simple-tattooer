import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Pressable, Image, Keyboard } from "react-native";
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
import { EventBlockTimeRecord, getEventBlockTimeById, updateEventBlockTime, UpdateEventBlockTimeInput, checkEventOverlap } from '@/lib/services/calendar-service';
import { convertTimeToISOString, convertTimeToHHMMString, parseYmdFromDb } from "@/lib/utils";
import { Collapse } from "@/components/lib/collapse";
import { LocationModal } from "@/components/lib/location-modal";
import { Locations } from "@/lib/redux/types";

import X_IMAGE from "@/assets/images/icons/x.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";
import { DatePicker } from "@/components/lib/date-picker";

const repeatTypeChunks = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
]

type EventBlockTimeData = {
    id: string;
    date: string;
    title: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    isRepeat: boolean;
    repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    repeatLength?: number;
    repeatUnit?: 'days' | 'weeks' | 'months' | 'years';
    eventNotes: string;
};

const repeatDuration = (length?: number, unit?: 'days' | 'weeks' | 'months' | 'years'): { value: number; unit: 'days' | 'weeks' | 'months' | 'years' } | undefined => {
    if (!length || !unit) return undefined;
    if (length <= 0) return undefined;
    return { value: length, unit };
};

const getDisableUnits = (repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly'): ('days' | 'weeks' | 'months' | 'years')[] => {
    if (!repeatType) return ['days', 'weeks', 'months', 'years'];
    if (repeatType === 'daily') return [];
    if (repeatType === 'weekly') return ['days'];
    if (repeatType === 'monthly') return ['days', 'weeks'];
    if (repeatType === 'yearly') return ['days', 'weeks', 'months'];
    return [];
}

export default function AddEventBlockTimePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { artist } = useAuth();
    const [loading, setLoading] = useState(false);
    const { id } = useLocalSearchParams<{ id: string }>();
    const [event, setEvent] = useState<EventBlockTimeRecord | null>(null);
    const [openTempLocationModal, setOpenTempLocationModal] = useState(false);
    const [formData, setFormData] = useState<EventBlockTimeData>({
        id: '',
        date: '',
        title: '',
        startTime: '',
        endTime: '',
        location: '',
        isRepeat: false,
        repeatType: undefined,
        repeatLength: undefined,
        repeatUnit: 'days',
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
            // Convert repeat_type to repeatUnit for DurationPicker
            let repeatUnit: 'days' | 'weeks' | 'months' | 'years' = 'days';
            const repeatType = event.repeat_type as 'daily' | 'weekly' | 'monthly' | 'yearly' | null | undefined;
            if (repeatType === 'daily') {
                repeatUnit = 'days';
            } else if (repeatType === 'weekly') {
                repeatUnit = 'weeks';
            } else if (repeatType === 'monthly') {
                repeatUnit = 'months';
            } else if (repeatType === 'yearly') {
                repeatUnit = 'years';
            } else if (event.repeat_duration_unit) {
                repeatUnit = event.repeat_duration_unit as 'days' | 'weeks' | 'months' | 'years';
            }
            setFormData({
                id: event.id,
                date: event.date,
                title: event.title,
                startTime: event.start_time,
                endTime: event.end_time,
                isRepeat: event.repeatable,
                repeatType: repeatType || undefined,
                repeatLength: event.repeat_duration ?? undefined,
                repeatUnit: repeatUnit || 'days',
                eventNotes: event.notes ?? '',
                location: event.location ?? '',
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

            if (formData.isRepeat && !formData.repeatType) {
                toast({ variant: 'error', title: 'Select repeat type', duration: 2500 });
                return;
            }
            if (formData.isRepeat && (!formData.repeatLength || formData.repeatLength <= 0)) {
                toast({ variant: 'error', title: 'Select repeat duration', duration: 2500 });
                return;
            }

            // Check for overlapping events before updating (only if date or time has changed)
            const dateOrTimeChanged = event && (
                event.date !== formData.date ||
                event.start_time !== formData.startTime ||
                event.end_time !== formData.endTime
            );

            if (dateOrTimeChanged) {
                try {
                    const break_time = (artist?.flow as any)?.break_time || 0;
                    const overlapCheck = await checkEventOverlap({
                        artistId: artist.id,
                        date: formData.date,
                        startTime: formData.startTime!,
                        endTime: formData.endTime!,
                        break_time: break_time,
                        source: 'block_time',
                    });

                    if (!overlapCheck.success) {
                        toast({ variant: 'error', title: overlapCheck.error || 'Failed to check for conflicts', duration: 3000 });
                        setLoading(false);
                        return;
                    }

                    if (overlapCheck.hasOverlap) {
                        toast({
                            variant: 'error',
                            title: 'Time conflict detected',
                            description: `This time overlaps with an existing event: ${overlapCheck.overlappingEvent?.title || 'Unknown'}`,
                            duration: 3000
                        });
                        setLoading(false);
                        return;
                    }
                } catch (overlapErr) {
                    console.error('Error checking for overlaps:', overlapErr);
                    // Continue with update even if overlap check fails
                }
            }

            const data: UpdateEventBlockTimeInput = {
                id: formData.id,
                date: formData.date ?? undefined,
                title: formData.title.trim(),
                start_time: formData.startTime,
                end_time: formData.endTime,
                repeatable: formData.isRepeat,
                repeat_type: formData.isRepeat ? formData.repeatType : undefined,
                repeat_duration: formData.isRepeat ? (formData.repeatLength ?? undefined) : undefined,
                repeat_duration_unit: formData.isRepeat ? formData.repeatUnit as 'days' | 'weeks' | 'months' | 'years' | undefined : undefined,
                notes: formData.eventNotes ?? undefined,
                location: formData.location ?? undefined,
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

    const handleLocationSelect = async (location: Locations) => {
        Keyboard.dismiss();
        setFormData(prev => ({ ...prev, location: location.address }));
        setOpenTempLocationModal(false);
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

                        >
                            <View className="gap-6 pb-6">
                                <View className="items-center justify-center pb-9">
                                    <Image
                                        source={APPOINTMENT_IMAGE}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Edit Event</Text>
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

                                    <View className="gap-2">
                                        <Text variant="h5">Choose Date</Text>
                                        <DatePicker
                                            selectedDateString={formData.date}
                                            onDateStringSelect={(date) => setFormData({ ...formData, date: date })}
                                            showInline={true}
                                            showTodayButton={false}
                                            selectionMode="single"
                                            className="border border-border rounded-sm p-2"
                                        />
                                    </View>

                                    <View className="items-start gap-2">
                                        <Collapse title="Location" textClassName="text-xl">
                                            <View className="gap-2 w-full">
                                                <Pressable onPress={() => setOpenTempLocationModal(true)} className="bg-background h-10 px-3 rounded-sm border border-border-white items-start justify-center">
                                                    <Text className={`${formData.location ? 'text-foreground' : 'text-muted-foreground'}`}>{formData.location || 'Select location'}</Text>
                                                </Pressable>
                                            </View>
                                        </Collapse>
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

                                    {formData.isRepeat && (
                                        <>
                                            <View className="gap-2 flex-row items-center">
                                                {repeatTypeChunks.map((repeatType) => {
                                                    const handleRepeatTypeSelect = () => {
                                                        const newRepeatType = repeatType.value as 'daily' | 'weekly' | 'monthly' | 'yearly';
                                                        const newRepeatUnit = newRepeatType === 'daily' ? 'days' :
                                                            newRepeatType === 'weekly' ? 'weeks' :
                                                                newRepeatType === 'monthly' ? 'months' :
                                                                    newRepeatType === 'yearly' ? 'years' : 'days';
                                                        setFormData({ ...formData, repeatType: newRepeatType, repeatUnit: newRepeatUnit });
                                                    };
                                                    return (
                                                        <Button
                                                            key={repeatType.value}
                                                            onPress={handleRepeatTypeSelect}
                                                            variant={formData.repeatType === repeatType.value ? 'default' : 'outline'}
                                                            className="max-w-[70px] w-full h-8 items-center justify-center px-0 py-0"
                                                        >
                                                            <Text variant='small'>{repeatType.label}</Text>
                                                        </Button>
                                                    );
                                                })}
                                            </View>

                                            <View className="gap-2">
                                                <Collapse title="How long do you want this to repeat for?" textClassName="text-xl">
                                                    <View className="gap-2 w-full">
                                                        <DurationPicker
                                                            selectedDuration={repeatDuration(formData.repeatLength, formData.repeatUnit)}
                                                            onDurationSelect={(duration) => setFormData({ ...formData, repeatLength: duration?.value, repeatUnit: duration?.unit as 'days' | 'weeks' | 'months' | 'years' })}
                                                            maxValue={12}
                                                            modalTitle="Select Repeat Duration"
                                                            disabledUnits={getDisableUnits(formData.repeatType)}
                                                        />
                                                    </View>
                                                </Collapse>
                                            </View>
                                        </>
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
                                        <Button onPress={handleCancel} variant="outline" disabled={loading}>
                                            <Text variant='h5'>Cancel</Text>
                                        </Button>
                                    </View>

                                    <View className="flex-1">
                                        <Button onPress={handleSave} variant="outline" disabled={loading || !hasChanges}>
                                            <Text variant='h5'>{loading ? 'Saving...' : 'Save'}</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper >

                <LocationModal
                    visible={openTempLocationModal}
                    onClose={() => {
                        Keyboard.dismiss();
                        setOpenTempLocationModal(false);
                    }}
                    selectedAddress={formData.location}
                    onLocationSelect={(loc) =>
                        handleLocationSelect({
                            address: loc.address,
                            place_id: loc.placeId,
                            coordinates: loc.coordinates,
                            is_main_studio: loc.isMainStudio,
                        })
                    }
                />
            </SafeAreaView >
        </>
    );
}
