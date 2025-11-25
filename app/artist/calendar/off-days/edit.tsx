import { useEffect, useState } from "react";
import { View, Pressable, ActivityIndicator, Image } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";
import X_IMAGE from "@/assets/images/icons/x.png";
import { useToast } from "@/lib/contexts/toast-context";
import { DatePicker } from "@/components/lib/date-picker";
import { DurationPicker } from "@/components/lib/duration-picker";
import { Collapse } from "@/components/lib/collapse";
import { getOffDayById, updateOffDay } from "@/lib/services/calendar-service";

export default function EditOffDaysPage() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { toast } = useToast();

    // Form state
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    type OffDaysFormData = {
        title: string;
        startDate: string;
        endDate: string;
        isRepeat: boolean;
        repeatType: 'daily' | 'weekly' | 'monthly';
        repeatDuration?: { value: number; unit: 'weeks' | 'months' | 'years' };
        notes: string;
    };
    const [formData, setFormData] = useState<OffDaysFormData>({
        title: '',
        startDate: '',
        endDate: '',
        isRepeat: false,
        repeatType: 'daily',
        repeatDuration: undefined,
        notes: '',
    });

    useEffect(() => {
        const load = async () => {
            if (!id) {
                toast({ variant: 'error', title: 'Missing off-day id' });
                router.back();
                return;
            }
            try {
                setInitialLoading(true);
                const res = await getOffDayById(id);
                if (!res.success || !res.data) {
                    toast({ variant: 'error', title: res.error || 'Failed to load off day' });
                    router.back();
                    return;
                }
                const od = res.data;
                setFormData({
                    title: od.title || '',
                    startDate: od.start_date || '',
                    endDate: od.end_date || '',
                    isRepeat: Boolean(od.is_repeat),
                    repeatType: (od.repeat_type ?? 'daily') as 'daily' | 'weekly' | 'monthly',
                    repeatDuration: od.repeat_duration != null && !!od.repeat_duration_unit
                        ? { value: Number(od.repeat_duration), unit: od.repeat_duration_unit as 'weeks' | 'months' | 'years' }
                        : undefined,
                    notes: od.notes || '',
                });
            } catch (e) {
                toast({ variant: 'error', title: 'Failed to load off day' });
                router.back();
            } finally {
                setInitialLoading(false);
            }
        };
        load();
    }, [id]);

    // Helpers to work with range selection (match add page)
    const buildRangeDates = (start?: string, end?: string): string[] => {
        if (!start || !end) return [];
        const startDate = new Date(start + 'T12:00:00');
        const endDate = new Date(end + 'T12:00:00');
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return [];
        const s = startDate <= endDate ? startDate : endDate;
        const e = endDate >= startDate ? endDate : startDate;
        const dates: string[] = [];
        const cursor = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 12);
        while (cursor <= e) {
            const y = cursor.getFullYear();
            const m = String(cursor.getMonth() + 1).padStart(2, '0');
            const d = String(cursor.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            cursor.setDate(cursor.getDate() + 1);
        }
        return dates;
    };

    const handleDatesStringSelect = (dates: string[]) => {
        if (!dates || dates.length === 0) {
            setFormData((prev: OffDaysFormData) => ({ ...prev, startDate: '', endDate: '' }));
            return;
        }
        const sorted = [...dates].sort();
        const start = sorted[0];
        const end = sorted[sorted.length - 1];
        setFormData((prev: OffDaysFormData) => ({ ...prev, startDate: start, endDate: end }));
    };

    // Disable repeat types depending on the selected range
    const rangeLength = (formData.startDate && formData.endDate)
        ? buildRangeDates(formData.startDate, formData.endDate).length
        : 0;
    const disableDaily = rangeLength > 1;
    const disableWeekly = rangeLength > 7;

    // Auto-correct repeatType if it becomes invalid for the current range
    useEffect(() => {
        if (!formData.isRepeat) return;
        setFormData(prev => {
            if (disableDaily && prev.repeatType === 'daily') {
                const nextType = disableWeekly ? 'monthly' : 'weekly';
                return { ...prev, repeatType: nextType };
            }
            if (disableWeekly && prev.repeatType === 'weekly') {
                const nextType = disableDaily ? 'monthly' : 'daily';
                return { ...prev, repeatType: nextType };
            }
            return prev;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disableDaily, disableWeekly, formData.isRepeat, formData.startDate, formData.endDate]);

    const handleBack = () => {
        router.back();
    };

    const handleSave = async () => {
        if (!formData.title?.trim()) {
            toast({ variant: 'error', title: 'Title is required' });
            return;
        }
        if (!formData.startDate || !formData.endDate) {
            toast({ variant: 'error', title: 'Select start and end dates' });
            return;
        }
        if (formData.startDate === formData.endDate) {
            toast({ variant: 'error', title: 'Select start and end date' });
            return;
        }
        if (formData.endDate < formData.startDate) {
            toast({ variant: 'error', title: 'End date must be after start date' });
            return;
        }
        if (formData.isRepeat && (!formData.repeatDuration || !formData.repeatDuration.value || formData.repeatDuration.value <= 0)) {
            toast({ variant: 'error', title: 'Select repeat duration' });
            return;
        }

        // Enforce repeat-type constraints based on selected range length
        const rangeLen = buildRangeDates(formData.startDate, formData.endDate).length;
        if (formData.isRepeat && formData.repeatType === 'daily' && rangeLen > 1) {
            toast({ variant: 'error', title: 'Daily repeat is not allowed for a multi-day range' });
            return;
        }
        if (formData.isRepeat && formData.repeatType === 'weekly' && rangeLen > 7) {
            toast({ variant: 'error', title: 'Weekly repeat is not allowed for ranges longer than one week' });
            return;
        }

        try {
            setLoading(true);
            if (!id) throw new Error('Missing id');
            const result = await updateOffDay(id, {
                title: formData.title.trim(),
                start_date: formData.startDate,
                end_date: formData.endDate,
                is_repeat: formData.isRepeat,
                repeat_type: formData.repeatType,
                repeat_duration: formData.isRepeat ? (formData.repeatDuration?.value ?? 1) : undefined,
                repeat_duration_unit: formData.isRepeat
                    ? (formData.repeatDuration?.unit ?? (formData.repeatType === 'monthly' ? 'months' : 'weeks'))
                    : undefined,
                notes: formData.notes?.trim() || null,
            });
            if (!result.success) {
                toast({ variant: 'error', title: result.error || 'Failed to update off day' });
                return;
            }

            toast({ variant: 'success', title: 'Event updated!', duration: 3000 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        } catch (error) {
            toast({ variant: 'error', title: 'Failed to update off day', description: error instanceof Error ? error.message : 'Unknown error' });
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
                <View className="flex-1 bg-background px-4 pt-2 pb-8">
                    <KeyboardAwareScrollView
                        bottomOffset={50}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        className="flex-1"
                    >
                        <View className="gap-6 pb-6">
                            <View className="items-center justify-center pb-9">
                                <Image
                                    source={APPOINTMENT_IMAGE}
                                    style={{ width: 56, height: 56 }}
                                    resizeMode="contain"
                                />
                                <Text variant="h6" className="text-center uppercase">Edit Book Off/</Text>
                                <Text variant="h6" className="text-center uppercase leading-none">Multiple Days</Text>
                            </View>

                            {/* Form Fields */}
                            {initialLoading ? (
                                <View className="flex-1 items-center justify-center py-20">
                                    <ActivityIndicator size="large" color="#fff" />
                                </View>
                            ) : (
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
                                            selectedDatesStrings={buildRangeDates(formData.startDate, formData.endDate)}
                                            onDatesStringSelect={handleDatesStringSelect}
                                            showInline={true}
                                            showTodayButton={false}
                                            selectionMode="range"
                                            className="border border-border rounded-sm p-2"
                                        />
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

                                        {formData.isRepeat && (
                                            <View className="gap-2">
                                                <View className="flex-row items-center gap-2">
                                                    <Button disabled={disableDaily} onPress={() => setFormData({ ...formData, repeatType: 'daily' })} variant={formData.repeatType === 'daily' ? 'default' : 'outline'} className="w-[78px] h-8 items-center justify-center px-0 py-0">
                                                        <Text variant='small'>Daily</Text>
                                                    </Button>
                                                    <Button disabled={disableWeekly} onPress={() => setFormData({ ...formData, repeatType: 'weekly' })} variant={formData.repeatType === 'weekly' ? 'default' : 'outline'} className="w-[78px] h-8 items-center justify-center px-0 py-0">
                                                        <Text variant='small'>Weekly</Text>
                                                    </Button>
                                                    <Button onPress={() => setFormData({ ...formData, repeatType: 'monthly' })} variant={formData.repeatType === 'monthly' ? 'default' : 'outline'} className="w-[78px] h-8 items-center justify-center px-0 py-0">
                                                        <Text variant='small'>Monthly</Text>
                                                    </Button>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {formData.isRepeat && (
                                        <View className="gap-2">
                                            <Collapse title="How long do you want this to repeat for?" textClassName="text-xl">
                                                <View className="gap-2 w-full">
                                                    <DurationPicker
                                                        selectedDuration={formData.repeatDuration}
                                                        onDurationSelect={(duration) => setFormData({ ...formData, repeatDuration: duration })}
                                                        maxValue={12}
                                                        modalTitle="Select Repeat Duration"
                                                        disabledUnits={formData.repeatType === 'monthly' ? ['weeks'] : undefined}
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
                                            value={formData.notes}
                                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                                        />
                                    </View>
                                    <View className="flex-row gap-3">
                                        <View className="flex-1">
                                            <Button onPress={handleCancel} size="lg" variant="outline" disabled={loading}>
                                                <Text variant='h5'>Cancel</Text>
                                            </Button>
                                        </View>
                                        <View className="flex-1">
                                            <Button onPress={handleSave} size="lg" disabled={loading}>
                                                <Text variant='h5'>{loading ? 'Saving...' : 'Save'}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </SafeAreaView >
        </>
    );
}
