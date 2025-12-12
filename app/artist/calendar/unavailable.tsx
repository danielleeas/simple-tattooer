import { useCallback, useEffect, useState } from "react";
import { View, Pressable, Image, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/lib/contexts/toast-context";
import { DurationPicker } from "@/components/lib/duration-picker";
import { useAuth } from '@/lib/contexts/auth-context';
import { Collapse } from "@/components/lib/collapse";
import { createMarkUnavailable, getMarkUnavailableById, updateMarkUnavailable, deleteMarkUnavailable, checkSpotConventionsOverlap } from '@/lib/services/calendar-service';
import { parseYmdFromDb, formatDate } from "@/lib/utils";
import CustomModal from "@/components/lib/custom-modal";

import X_IMAGE from "@/assets/images/icons/x.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";

const repeatTypeChunks = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
]

type MarkUnavailableData = {
    id?: string;
    date: string;
    repeatable: boolean;
    repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    repeatLength: number | undefined;
    repeatUnit: 'days' | 'weeks' | 'months' | 'years' | undefined;
    notes: string;
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

export default function MarkUnavailablePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { artist } = useAuth();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showOverlapModal, setShowOverlapModal] = useState(false);
    const [overlapDates, setOverlapDates] = useState<string[]>([]);
    const { date, id } = useLocalSearchParams<{ date?: string, id?: string }>();
    const isEdit = !!id;

    const [formData, setFormData] = useState<MarkUnavailableData>({
        date: '',
        repeatable: false,
        repeatType: undefined,
        repeatLength: undefined,
        repeatUnit: undefined,
        notes: '',
    });

    const loadEvent = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await getMarkUnavailableById(id);
            if (res.success && res.data) {
                // Convert repeat_type to repeatUnit for DurationPicker
                let repeatUnit: 'days' | 'weeks' | 'months' | 'years' = 'days';
                const repeatType = res.data.repeat_type as 'daily' | 'weekly' | 'monthly' | 'yearly' | null | undefined;
                if (repeatType === 'daily') {
                    repeatUnit = 'days';
                } else if (repeatType === 'weekly') {
                    repeatUnit = 'weeks';
                } else if (repeatType === 'monthly') {
                    repeatUnit = 'months';
                } else if (repeatType === 'yearly') {
                    repeatUnit = 'years';
                } else if (res.data.repeat_duration_unit) {
                    repeatUnit = res.data.repeat_duration_unit as 'days' | 'weeks' | 'months' | 'years';
                }
                setFormData({
                    id: res.data.id,
                    date: res.data.date,
                    repeatable: res.data.repeatable,
                    repeatType: repeatType || undefined,
                    repeatLength: res.data.repeat_duration ?? 1,
                    repeatUnit: repeatUnit || 'days',
                    notes: res.data.notes || '',
                });
            }
        } catch (e) {
            toast({ variant: 'error', title: 'Failed to load', duration: 2500 });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        if (isEdit) {
            loadEvent();
        }
    }, [isEdit, loadEvent]);

    const handleBack = () => {
        router.back();
    };

    const getDateStr = () => {
        const pad = (n: number) => String(n).padStart(2, '0');
        // For edit mode, use formData.date; for add mode, use date param
        const sourceDate = isEdit ? formData.date : date;
        if (sourceDate) {
            try {
                const d = parseYmdFromDb(String(sourceDate));
                if (!isNaN(d.getTime())) {
                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                }
            } catch { /* noop */ }
            const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(sourceDate));
            if (m) return `${m[1]}-${m[2]}-${m[3]}`;
        }
        const now = new Date();
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    };

    const handleSave = async () => {
        setShowOverlapModal(false);

        if (!artist?.id) {
            toast({ variant: 'error', title: 'Not authenticated', duration: 2500 });
            return;
        }

        if (formData.repeatable && !formData.repeatType) {
            toast({ variant: 'error', title: 'Select repeat type', duration: 2500 });
            return;
        }
        if (formData.repeatable && (!formData.repeatLength || formData.repeatLength <= 0)) {
            toast({ variant: 'error', title: 'Select repeat duration', duration: 2500 });
            return;
        }

        const dateStr = getDateStr();

        try {
            setLoading(true);

            const params = {
                artistId: artist.id,
                date: dateStr,
                repeatable: formData.repeatable,
                repeatType: formData.repeatable ? formData.repeatType : undefined,
                repeatDuration: formData.repeatable ? formData.repeatLength : undefined,
                repeatDurationUnit: formData.repeatable ? formData.repeatUnit : undefined,
                notes: formData.notes?.trim() || undefined,
            };

            const result = isEdit
                ? await updateMarkUnavailable(id!, params)
                : await createMarkUnavailable(params);

            if (!result.success) {
                toast({ variant: 'error', title: result.error || 'Failed to save', duration: 3000 });
                return;
            }

            toast({ variant: 'success', title: isEdit ? 'Updated!' : 'Day marked unavailable!', duration: 3000 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        } catch (e) {
            toast({ variant: 'error', title: e instanceof Error ? e.message : 'Unexpected error', duration: 3000 });
        } finally {
            setLoading(false);
        } 
    };

    const handleCheckForOverlap = async () => {
        if (!artist?.id) {
            toast({ variant: 'error', title: 'Not authenticated', duration: 2500 });
            return;
        }

        const dateStr = getDateStr();

        try {
            setLoading(true);

            const overlapCheck = await checkSpotConventionsOverlap({
                artistId: artist.id,
                date: dateStr,
            });
            if (!overlapCheck.success) {
                toast({ variant: 'error', title: overlapCheck.error || 'Failed to check for conflicts', duration: 3000 });
                return;
            }
            if (overlapCheck.hasOverlap) {
                setOverlapDates([dateStr]);
                setShowOverlapModal(true);
                return;
            }

            await handleSave();
        } catch (e) {
            toast({ variant: 'error', title: e instanceof Error ? e.message : 'Unexpected error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!id) return;
        try {
            setDeleting(true);
            const result = await deleteMarkUnavailable(id);
            if (!result.success) {
                toast({ variant: 'error', title: result.error || 'Failed to delete', duration: 3000 });
                return;
            }
            setIsDeleteModalOpen(false);
            toast({ variant: 'success', title: 'Deleted!', duration: 3000 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        } catch (e) {
            toast({ variant: 'error', title: e instanceof Error ? e.message : 'Unexpected error', duration: 3000 });
        } finally {
            setDeleting(false);
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
                            
                        >
                            <View className="gap-6 pb-6">
                                <View className="items-center justify-center pb-9">
                                    <Image
                                        source={APPOINTMENT_IMAGE}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Mark Day</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Unavailable</Text>
                                </View>

                                {/* Form Fields */}
                                <View className="gap-6">

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
                                </View>
                                <View className="flex-row gap-3">
                                    {isEdit && (
                                        <View className="flex-1">
                                            <Button variant="outline" onPress={() => setIsDeleteModalOpen(true)} disabled={loading || deleting}>
                                                <Text variant='h5'>Delete</Text>
                                            </Button>
                                        </View>
                                    )}
                                    <View className="flex-1">
                                        <Button variant="outline" onPress={handleCheckForOverlap} disabled={loading || deleting}>
                                            <Text variant='h5'>{loading ? 'Saving...' : 'Save'}</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>

                    <Modal
                        visible={isDeleteModalOpen}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setIsDeleteModalOpen(false)}
                    >
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-background-secondary rounded-t-3xl p-6 gap-6">
                                <View style={{ gap: 8, alignItems: 'center' }}>
                                    <Image source={require('@/assets/images/icons/warning_circle.png')} style={{ width: 80, height: 80 }} />
                                    <Text variant="h3">Delete Event</Text>
                                    <Text className="text-text-secondary text-center text-sm leading-5">Are you sure? This action can't be undone.</Text>
                                </View>
                                <View style={{ gap: 8, flexDirection: 'row' }}>
                                    <View style={{ flex: 1 }}>
                                        <Button variant="outline" onPress={() => setIsDeleteModalOpen(false)} disabled={deleting} size='lg' className='items-center justify-center'>
                                            <Text>Cancel</Text>
                                        </Button>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Button variant="outline" onPress={handleDeleteConfirm} size='lg' disabled={deleting} className='items-center justify-center'>
                                            <Text>{deleting ? 'Deleting...' : 'Delete'}</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Modal>

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
                                    {overlapDates.map((d) => formatDate(d, false, true)).join(', ')}
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
                </StableGestureWrapper >
            </SafeAreaView >
        </>
    );
}
