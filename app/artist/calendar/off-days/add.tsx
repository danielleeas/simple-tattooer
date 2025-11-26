import { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import X_IMAGE from "@/assets/images/icons/x.png";
import { useToast } from "@/lib/contexts/toast-context";
import { useAuth } from "@/lib/contexts/auth-context";
import { DatePicker } from "@/components/lib/date-picker";
import { DurationPicker } from "@/components/lib/duration-picker";
import { Collapse } from "@/components/lib/collapse";
import { createOffDays } from "@/lib/services/calendar-service";

type OffDaysFormData = {
    title: string;
    startDate: string;
    endDate: string;
    isRepeat: boolean;
    repeatLength?: number;
    repeatUnit?: 'days' | 'weeks' | 'months' | 'years';
    notes: string;
};

export default function AddOffDaysPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { artist } = useAuth();

    // Form state
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<OffDaysFormData>({
        title: '',
        startDate: '',
        endDate: '',
        isRepeat: false,
        repeatLength: undefined,
        repeatUnit: 'days',
        notes: '',
    });

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

    const repeatDuration = (length?: number, unit?: 'days' | 'weeks' | 'months' | 'years'): { value: number; unit: 'days' | 'weeks' | 'months' | 'years' } | undefined => {
        if (!length || !unit) return undefined;
        if (length <= 0) return undefined;
        return { value: length, unit };
    };

    const getDisableUnits = (start: string, end: string): ('days' | 'weeks' | 'months' | 'years')[] => {
        if (!start || !end) return ['days', 'weeks', 'months', 'years'];
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        // Räkna kalenderveckor (vecka börjar måndag)
        const getWeekNumber = (date: Date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + 4 - (d.getDay() || 7));
            const yearStart = new Date(d.getFullYear(), 0, 1);
            return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };
        
        const startWeek = getWeekNumber(startDate);
        const endWeek = getWeekNumber(endDate);
        const startMonth = startDate.getMonth();
        const endMonth = endDate.getMonth();
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        
        const spansMultipleWeeks = endWeek !== startWeek || endYear !== startYear;
        const spansMultipleMonths = endMonth !== startMonth || endYear !== startYear;
        const spansMultipleYears = endYear !== startYear;
        
        const disabled: ('days' | 'weeks' | 'months' | 'years')[] = ['days'];
        
        if (spansMultipleWeeks) disabled.push('weeks');
        if (spansMultipleMonths) disabled.push('months');
        if (spansMultipleYears) disabled.push('years');
        
        return disabled;
    }

    const getRepeatType = (unit?: 'days' | 'weeks' | 'months' | 'years'): 'daily' | 'weekly' | 'monthly' | 'yearly' => {
        if (!unit) return 'daily';
        if (unit === 'days') return 'daily';
        if (unit === 'weeks') return 'weekly';
        if (unit === 'months') return 'monthly';
        if (unit === 'years') return 'yearly';
        return 'daily';
    };

    const handleBack = () => {
        router.back();
    };

    const handleSave = async () => {
        if (!artist?.id) {
            toast({ variant: 'error', title: 'Error', description: 'Missing artist.' });
            return;
        }
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
        if (formData.isRepeat && (!formData.repeatLength || formData.repeatLength <= 0)) {
            toast({ variant: 'error', title: 'Select repeat duration' });
            return;
        }

        try {
            setLoading(true);
            const result = await createOffDays({
                artistId: artist.id,
                title: formData.title.trim(),
                startDate: formData.startDate,
                endDate: formData.endDate,
                isRepeat: formData.isRepeat,
                repeatType: getRepeatType(formData.repeatUnit),
                repeatDuration: formData.isRepeat ? (formData.repeatLength ?? 1) : undefined,
                repeatDurationUnit: formData.isRepeat ? formData.repeatUnit : undefined,
                notes: formData.notes?.trim() || undefined,
            });
            if (!result.success) {
                toast({ variant: 'error', title: 'Failed to add off days', description: result.error });
                return;
            }

            toast({ variant: 'success', title: 'New Event Added!', duration: 3000 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        } catch (error) {
            toast({ variant: 'error', title: 'Failed to add off days', description: error instanceof Error ? error.message : 'Unknown error' });
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
                <View className="flex-1 bg-background px-4 pt-2 pb-8">
                    <KeyboardAwareScrollView
                        bottomOffset={50}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        className="flex-1"
                    >
                        <View className="gap-6 pb-6">
                            <View className="flex-row items-center gap-4">
                                <View className="h-6 w-6 rounded-xl bg-blue-500" />
                                <Text variant="h4" className="leading-8 flex-1">Book Multiple Days Off</Text>
                            </View>

                            {/* Form Fields */}
                            <View className="gap-6">
                                {/* Event Name */}
                                <View className="gap-2">
                                    <Text variant="h5">Title</Text>
                                    <Input
                                        spellCheck={false}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="off"
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
                                        <Collapse title="How long do you want this to repeat for?" textClassName="text-xl">
                                            <View className="gap-2 w-full">
                                                <DurationPicker
                                                    selectedDuration={repeatDuration(formData.repeatLength, formData.repeatUnit)}
                                                    onDurationSelect={(duration) => setFormData({ ...formData, repeatLength: duration?.value, repeatUnit: duration?.unit })}
                                                    maxValue={12}
                                                    modalTitle="Select Repeat Duration"
                                                    disabledUnits={getDisableUnits(formData.startDate, formData.endDate)}
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

                                <Button onPress={handleSave} variant="outline" disabled={loading}>
                                    <Text variant='h5'>{loading ? 'Adding...' : 'Add to Calendar'}</Text>
                                </Button>
                            </View>
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </SafeAreaView >
        </>
    );
}
