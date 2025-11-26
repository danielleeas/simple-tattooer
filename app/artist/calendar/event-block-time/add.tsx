import { useState } from "react";
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
import { createEventBlockTime } from '@/lib/services/calendar-service';
import { convertTimeToISOString, convertTimeToHHMMString, parseYmdFromDb } from "@/lib/utils";
import { Collapse } from "@/components/lib/collapse";

import X_IMAGE from "@/assets/images/icons/x.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";

type EventBlockTimeData = {
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
    const { date } = useLocalSearchParams<{ date?: string }>();

    console.log(date)

    const [formData, setFormData] = useState<EventBlockTimeData>({
        title: '',
        startTime: "08:00",
        endTime: "10:00",
        isRepeat: false,
        repeatLength: undefined,
        repeatUnit: undefined,
        eventNotes: '',
    });

    const handleBack = () => {
        router.back();
    };

    const handleSave = async () => {
        // Basic validations (mirror off-days add flow)
        if (!artist?.id) {
            toast({ variant: 'error', title: 'Not authenticated', duration: 2500 });
            return;
        }
        if (!formData.title?.trim()) {
            toast({ variant: 'error', title: 'Title is required', duration: 2500 });
            return;
        }
        if (!formData.startTime || !formData.endTime) {
            toast({ variant: 'error', title: 'Start and End time are required', duration: 2500 });
            return;
        }
        // Optional: ensure end time is after start time
        if (formData.startTime && formData.endTime) {
            const [sh, sm] = formData.startTime.split(':').map(n => parseInt(n, 10));
            const [eh, em] = formData.endTime.split(':').map(n => parseInt(n, 10));
            const startMinutes = sh * 60 + sm;
            const endMinutes = eh * 60 + em;
            if (endMinutes <= startMinutes) {
                toast({ variant: 'error', title: 'End time must be after start time', duration: 2500 });
                return;
            }
        }
        if (formData.isRepeat && (!formData.repeatLength || formData.repeatLength <= 0)) {
            toast({ variant: 'error', title: 'Select repeat duration', duration: 2500 });
            return;
        }

        // Derive YYYY-MM-DD directly from the input without timezone conversions
        const dateStr = (() => {
            const pad = (n: number) => String(n).padStart(2, '0');
            if (date) {
                try {
                    const d = parseYmdFromDb(String(date));
                    if (!isNaN(d.getTime())) {
                        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                    }
                } catch { /* noop */ }
                // Fallback: if string starts with YYYY-MM-DD, take that portion
                const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date));
                if (m) return `${m[1]}-${m[2]}-${m[3]}`;
            }
            const now = new Date();
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        })();

        try {
            setLoading(true);
            const result = await createEventBlockTime({
                artistId: artist.id,
                date: dateStr,
                title: formData.title.trim(),
                startTime: formData.startTime,
                endTime: formData.endTime,
                repeatable: formData.isRepeat,
                repeatType: formData.isRepeat ? getRepeatType(formData.repeatUnit) : undefined,
                repeatDuration: formData.isRepeat ? (formData.repeatLength ?? 1) : undefined,
                repeatDurationUnit: formData.isRepeat ? formData.repeatUnit : undefined,
                notes: formData.eventNotes?.trim() || undefined,
            });

            if (!result.success) {
                toast({ variant: 'error', title: result.error || 'Failed to save event', duration: 3000 });
                return;
            }

            toast({ variant: 'success', title: 'New Event Added!', duration: 3000 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        } catch (e) {
            toast({ variant: 'error', title: e instanceof Error ? e.message : 'Unexpected error', duration: 3000 });
        } finally {
            setLoading(false);
        }
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
                                    <Text variant="h6" className="text-center uppercase">Add Event</Text>
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
                                                        selectedDuration={repeatDuration(formData.repeatLength, formData.repeatUnit)}
                                                        onDurationSelect={(duration) => setFormData({ ...formData, repeatLength: duration?.value, repeatUnit: duration?.unit })}
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
                                            value={formData.eventNotes}
                                            onChangeText={(text) => setFormData({ ...formData, eventNotes: text })}
                                        />
                                    </View>
                                </View>

                                <Button onPress={handleSave} variant="outline" disabled={loading}>
                                    <Text variant='h5'>{loading ? 'Saving...' : 'Add To Calendar'}</Text>
                                </Button>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper >
            </SafeAreaView >
        </>
    );
}
