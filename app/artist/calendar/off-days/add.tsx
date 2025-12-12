import { useState } from "react";
import { View, Pressable } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from "expo-router";

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
import { checkSpotConventionsOverlap, createOffDays } from "@/lib/services/calendar-service";
import CustomModal from "@/components/lib/custom-modal";
import { formatDate } from "@/lib/utils";

const repeatTypeChunks = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
]

type OffDaysFormData = {
    title: string;
    startDate: string;
    endDate: string;
    isRepeat: boolean;
    repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
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
    const [showOverlapModal, setShowOverlapModal] = useState(false);
    const [overlapDates, setOverlapDates] = useState<string[]>([]);
    const [formData, setFormData] = useState<OffDaysFormData>({
        title: '',
        startDate: '',
        endDate: '',
        isRepeat: false,
        repeatType: undefined,
        repeatLength: undefined,
        repeatUnit: 'days',
        notes: '',
    });

    const buildRangeDates = (start?: string, end?: string): string[] => {
        if (!start || !end) return [];
        // Parse YYYY-MM-DD strings in local timezone
        const [startYear, startMonth, startDay] = start.split('-').map(Number);
        const [endYear, endMonth, endDay] = end.split('-').map(Number);
        const startDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0, 0);
        const endDate = new Date(endYear, endMonth - 1, endDay, 12, 0, 0, 0);
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

    const getDisableUnits = (repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly'): ('days' | 'weeks' | 'months' | 'years')[] => {
        if (!repeatType) return ['days', 'weeks', 'months', 'years'];
        if (repeatType === 'daily') return [];
        if (repeatType === 'weekly') return ['days'];
        if (repeatType === 'monthly') return ['days', 'weeks'];
        if (repeatType === 'yearly') return ['days', 'weeks', 'months'];
        return [];
    }

    const getDisableRepeatTypes = (start: string, end: string): ('daily' | 'weekly' | 'monthly')[] => {
        let disabled: ('daily' | 'weekly' | 'monthly')[] = [];
        if (!start || !end) {
            return ['daily', 'weekly', 'monthly'];
        };

        if (start !== end) {
            disabled.push('daily');
        };

        const getWeekNumber = (date: Date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + 4 - (d.getDay() || 7));
            const yearStart = new Date(d.getFullYear(), 0, 1);
            return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };

        // Parse YYYY-MM-DD strings in local timezone
        const [startYearParsed, startMonthParsed, startDayParsed] = start.split('-').map(Number);
        const [endYearParsed, endMonthParsed, endDayParsed] = end.split('-').map(Number);
        const startDate = new Date(startYearParsed, startMonthParsed - 1, startDayParsed, 0, 0, 0, 0);
        const endDate = new Date(endYearParsed, endMonthParsed - 1, endDayParsed, 0, 0, 0, 0);
        const startWeek = getWeekNumber(startDate);
        const endWeek = getWeekNumber(endDate);
        const startMonth = startDate.getMonth();
        const endMonth = endDate.getMonth();
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();

        console.log('startWeek', startWeek);
        console.log('endWeek', endWeek);

        const spansMultipleWeeks = endWeek !== startWeek || endYear !== startYear;
        const spansMultipleMonths = endMonth !== startMonth || endYear !== startYear;
        if (spansMultipleWeeks) disabled.push('weekly');
        if (spansMultipleMonths) disabled.push('monthly');
        return disabled;
    };

    const handleBack = () => {
        router.back();
    };

    const handleCheckForOverlap = async () => {

        if (!artist?.id) {
            toast({ variant: 'error', title: 'Error', description: 'Missing artist.' });
            return;
        }

        try {
            setLoading(true);
            const dataRange = buildRangeDates(formData.startDate, formData.endDate);

            let overlaps: string[] = [];
            for (const date of dataRange) {
                const overlapCheck = await checkSpotConventionsOverlap({
                    artistId: artist.id,
                    date: date,
                });
                if (!overlapCheck.success) {
                    toast({ variant: 'error', title: overlapCheck.error || 'Failed to check for conflicts', duration: 3000 });
                    return;
                }
                if (overlapCheck.hasOverlap) {
                    overlaps.push(date);
                }
            }

            if (overlaps.length > 0) {
                setOverlapDates(overlaps);
                setShowOverlapModal(true);
                return;
            }
        } catch (error) {
            toast({ variant: 'error', title: 'Failed to check for overlaps', description: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async () => {
        setShowOverlapModal(false)
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
                repeatType: formData.repeatType,
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

                                {formData.isRepeat && formData.startDate && formData.endDate && (
                                    <>
                                        <View className="gap-2 flex-row items-center">
                                            {repeatTypeChunks.map((repeatType) => (
                                                <Button
                                                    key={repeatType.value}
                                                    onPress={() => setFormData({ ...formData, repeatType: repeatType.value as 'daily' | 'weekly' | 'monthly' })}
                                                    variant={formData.repeatType === repeatType.value ? 'default' : 'outline'}
                                                    className="max-w-[70px] w-full h-8 items-center justify-center px-0 py-0"
                                                    disabled={getDisableRepeatTypes(formData.startDate, formData.endDate).includes(repeatType.value as 'daily' | 'weekly' | 'monthly')}
                                                >
                                                    <Text variant='small'>{repeatType.label}</Text>
                                                </Button>
                                            ))}
                                        </View>

                                        <View className="gap-2">
                                            <Collapse title="How long do you want this to repeat for?" textClassName="text-xl">
                                                <View className="gap-2 w-full">
                                                    <DurationPicker
                                                        selectedDuration={repeatDuration(formData.repeatLength, formData.repeatUnit)}
                                                        onDurationSelect={(duration) => setFormData({ ...formData, repeatLength: duration?.value, repeatUnit: duration?.unit })}
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
                                        value={formData.notes}
                                        onChangeText={(text) => setFormData({ ...formData, notes: text })}
                                    />
                                </View>

                                <Button onPress={handleCheckForOverlap} variant="outline" disabled={loading}>
                                    <Text variant='h5'>{loading ? 'Adding...' : 'Add to Calendar'}</Text>
                                </Button>
                            </View>
                        </View>
                    </KeyboardAwareScrollView>
                </View>

                <CustomModal
                    visible={showOverlapModal}
                    onClose={() => setShowOverlapModal(false)}
                    variant="center"
                    showCloseButton={false}
                    closeOnBackdrop={false}
                >
                    <View className="px-6 py-6 bg-background-secondary rounded-lg">
                        <View className="items-center gap-4 mb-6">
                            <Text variant="h6" className="text-center">Guest spot already scheduled</Text>
                            <Text className="text-center text-text-secondary">
                                These dates have an active guest spot:
                            </Text>
                            <Text className="text-center font-semibold">
                                {overlapDates.map((date) => formatDate(date, false, true)).join(', ')}
                            </Text>
                            <Text className="text-center text-text-secondary">
                                Turning off availability will disable auto booking & consults for this guest spot.
                            </Text>
                            <Text className="text-text-secondary text-center text-sm leading-5">Are you sure?</Text>
                        </View>
                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <Button variant="outline" onPress={() => setShowOverlapModal(false)}>
                                    <Text variant="h5">Cancel</Text>
                                </Button>
                            </View>
                            <View className="flex-1">
                                <Button variant="outline" onPress={handleSave}>
                                    <Text variant="h5">Continue</Text>
                                </Button>
                            </View>
                        </View>
                    </View>
                </CustomModal>
            </SafeAreaView >
        </>
    );
}
