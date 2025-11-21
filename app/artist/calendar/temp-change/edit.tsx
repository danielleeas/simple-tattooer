import { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/lib/time-picker';
import { Plus } from 'lucide-react-native';
import { sortWeekdays, capitalizeFirstLetter, convertTimeToISOString, convertTimeToHHMMString } from "@/lib/utils";

import X_IMAGE from "@/assets/images/icons/x.png";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { useToast } from "@/lib/contexts/toast-context";
import { DatePicker } from "@/components/lib/date-picker";
import { WeekdayToggle } from "@/components/lib/weekday-toggle";
import { Collapse } from "@/components/lib/collapse";
import type { Locations as ArtistLocation } from "@/lib/redux/types";
import { useAuth } from "@/lib/contexts/auth-context";
import { LocationModal } from "@/components/lib/location-modal";
import { addTemporaryLocation } from "@/lib/services/setting-service";
import { getTempChangeById, updateTempChange } from "@/lib/services/calendar-service";

export default function EditTempChangePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { artist } = useAuth();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [openTempLocationModal, setOpenTempLocationModal] = useState(false);
    const [locationData, setLocationData] = useState<ArtistLocation[]>([]);
    const [formData, setFormData] = useState<{
        start_date: string | null;
        end_date: string | null;
        work_days: string[];
        different_time_enabled: boolean;
        start_times: Record<string, string>;
        end_times: Record<string, string>;
        location_id: string;
        notes: string;
    }>({
        start_date: null,
        end_date: null,
        work_days: [],
        different_time_enabled: false,
        start_times: {},
        end_times: {},
        location_id: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (artist?.locations) {
            setLocationData(artist.locations);
        }
    }, [artist?.locations]);

    useEffect(() => {
        const loadExisting = async () => {
            if (!id) return;
            const res = await getTempChangeById(String(id));
            if (!res.success || !res.data) {
                toast({ variant: 'error', title: 'Failed to load event' });
                return;
            }
            const tc = res.data;
            // Ensure the location list contains the current location (in case it's not in artist.locations)
            if (tc.location && (tc.location.id ?? tc.location.place_id)) {
                setLocationData(prev => {
                    const key = tc.location!.id ?? tc.location!.place_id;
                    const exists = prev.some(l => (l.id ?? l.place_id) === key);
                    if (exists) return prev;
                    const normalized = ({
                        id: tc.location!.id as string,
                        address: tc.location!.address ?? undefined,
                        place_id: tc.location!.place_id ?? undefined,
                        // Provide required fields for Locations type with safe defaults
                        coordinates: { latitude: 0, longitude: 0 },
                        is_main_studio: false,
                    } as unknown) as ArtistLocation;
                    return [...prev, normalized];
                });
            }
            setFormData({
                start_date: tc.start_date,
                end_date: tc.end_date,
                work_days: tc.work_days || [],
                different_time_enabled: Boolean(tc.different_time_enabled),
                start_times: tc.start_times || {},
                end_times: tc.end_times || {},
                location_id: tc.location_id || '',
                notes: tc.notes || '',
            });
        };
        loadExisting();
    }, [id]);

    const createTime = (hours: number, minutes: number) => {
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return d;
    };

    const defaultStartTime = () => createTime(9, 0);
    const defaultEndTime = () => createTime(17, 0);

    const formatTimeHHmm = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleBack = () => {
        router.back();
    };

    const handleSave = async () => {
        if (!id) {
            toast({ variant: 'error', title: 'Missing event id' });
            return;
        }
        if (!artist?.id) {
            toast({ variant: 'error', title: 'Error', description: 'Missing artist.' });
            return;
        }
        if (!formData.start_date || !formData.end_date) {
            toast({ variant: 'error', title: 'Select start and end dates' });
            return;
        }
        if (formData.end_date < formData.start_date) {
            toast({ variant: 'error', title: 'End date must be after start date' });
            return;
        }
        if (!formData.location_id) {
            toast({ variant: 'error', title: 'Location is required' });
            return;
        }
        if ((formData.work_days?.length || 0) === 0) {
            toast({ variant: 'error', title: 'Select at least one work day' });
            return;
        }

        // If work days selected, ensure times exist for each
        if ((formData.work_days?.length || 0) > 0) {
            for (const d of formData.work_days || []) {
                const s = formData.start_times?.[d];
                const e = formData.end_times?.[d];
                if (!s || !e) {
                    toast({ variant: 'error', title: `Missing time for ${capitalizeFirstLetter(d)}` });
                    return;
                }
            }
        }

        try {
            setLoading(true);
            const result = await updateTempChange(String(id), {
                start_date: formData.start_date,
                end_date: formData.end_date,
                work_days: formData.work_days || [],
                different_time_enabled: formData.different_time_enabled || false,
                start_times: formData.start_times || {},
                end_times: formData.end_times || {},
                location_id: formData.location_id,
                notes: formData.notes?.trim() ?? null,
            });
            if (!result.success) {
                toast({ variant: 'error', title: 'Failed to save changes', description: result.error });
                return;
            }
            toast({ variant: 'success', title: 'Changes saved!', duration: 3000 });
            router.dismissTo('/artist/calendar');
        } catch (error) {
            toast({ variant: 'error', title: 'Failed to save changes', description: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDay = (day: string) => {
        setFormData(prev => {
            const isSelected = prev.work_days?.includes(day);
            if (isSelected) {
                const newWorkDays = (prev.work_days || []).filter(d => d !== day);
                const { [day]: _removedStart, ...remainingStartTimes } = prev.start_times || {};
                const { [day]: _removedEnd, ...remainingEndTimes } = prev.end_times || {};
                return {
                    ...prev,
                    work_days: sortWeekdays(newWorkDays),
                    start_times: remainingStartTimes,
                    end_times: remainingEndTimes,
                };
            } else {
                const newWorkDays = [...(prev.work_days || []), day];
                const newStartTimes = { ...(prev.start_times || {}) } as Record<string, string>;
                const newEndTimes = { ...(prev.end_times || {}) } as Record<string, string>;
                if (!newStartTimes[day]) newStartTimes[day] = '09:00';
                if (!newEndTimes[day]) newEndTimes[day] = '17:00';
                return {
                    ...prev,
                    work_days: sortWeekdays(newWorkDays),
                    start_times: newStartTimes,
                    end_times: newEndTimes,
                };
            }
        });
    };

    const handleLocationSelect = async (location: ArtistLocation) => {
        if (!artist?.id) {
            toast({ variant: 'error', title: 'Error', description: 'Missing artist.' });
            return;
        }
        const locationData = {
            address: location.address,
            place_id: location.place_id,
            coordinates: location.coordinates,
            is_main_studio: false,
            is_temporary: true,
        };
        const result = await addTemporaryLocation(artist.id, locationData);
        if (!result.success) {
            toast({
                variant: 'error',
                title: 'Error',
                description: result.error || 'Failed to add temporary location',
            });
        }
        setLocationData((prev) => {
            const newLoc = result.location as ArtistLocation | undefined;
            if (!newLoc) return prev;
            const newKey = newLoc.id ?? newLoc.place_id;
            const exists = prev.some(l => (l.id ?? l.place_id) === newKey);
            return exists ? prev : [...prev, newLoc];
        });
        setFormData({ ...formData, location_id: result.location?.id ?? result.location?.place_id ?? '' });
        setOpenTempLocationModal(false);
    };

    const setAllStartTimes = (time: Date) => {
        setFormData(prev => {
            const newStartTimes: Record<string, string> = {};
            prev.work_days?.forEach(day => {
                newStartTimes[day] = convertTimeToHHMMString(time);
            });
            return { ...prev, start_times: newStartTimes };
        });
    };

    const setAllEndTimes = (time: Date) => {
        setFormData(prev => {
            const newEmdTimes: Record<string, string> = {};
            prev.work_days?.forEach(day => {
                newEmdTimes[day] = convertTimeToHHMMString(time);
            });
            return { ...prev, end_times: newEmdTimes };
        });
    };

    const buildRangeDates = (start?: string | null, end?: string | null): string[] => {
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
            setFormData(prev => ({ ...prev, start_date: null, end_date: null }));
            return;
        }
        const sorted = [...dates].sort();
        const start = sorted[0];
        const end = sorted[sorted.length - 1];
        setFormData(prev => ({ ...prev, start_date: start, end_date: end }));
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
                            className="flex-1"
                        >
                            <View className="gap-6 pb-6">
                                <View className="flex-row items-start gap-4">
                                    <View className="h-6 w-6 rounded-xl bg-purple" />
                                    <Text variant="h4" className="leading-8">Edit Temporary Work Days</Text>
                                </View>

                                {/* Form Fields */}
                                <View className="gap-6">
                                    <View className="gap-2">
                                        <Text variant="h5">Choose Date</Text>
                                        <DatePicker
                                            selectedDatesStrings={buildRangeDates(formData.start_date, formData.end_date)}
                                            onDatesStringSelect={handleDatesStringSelect}
                                            showInline={true}
                                            showTodayButton={false}
                                            selectionMode="range"
                                            className="border border-border rounded-sm p-2"
                                        />
                                    </View>

                                    <View className="gap-2">
                                        <Text variant="h5">Choose Your New Work Days</Text>
                                        <View className="gap-2">
                                            <WeekdayToggle
                                                selectedDays={formData.work_days || []}
                                                onToggleDay={handleToggleDay}
                                            />
                                        </View>
                                    </View>

                                    <View className="flex-row items-start gap-1">
                                        <Pressable className="flex-1 gap-2" onPress={() => {
                                            const newValue = !formData.different_time_enabled;
                                            if (!newValue) {
                                                // Switching to "not enabled" - take times from first day and apply to all
                                                const firstDay = formData.work_days?.[0];
                                                if (firstDay && formData.start_times?.[firstDay] && formData.end_times?.[firstDay]) {
                                                    const startTime = formData.start_times[firstDay];
                                                    const endTime = formData.end_times[firstDay];
                                                    setFormData(prev => {
                                                        const newStartTimes: Record<string, string> = {};
                                                        const newEndTimes: Record<string, string> = {};
                                                        prev.work_days?.forEach(day => {
                                                            newStartTimes[day] = startTime;
                                                            newEndTimes[day] = endTime;
                                                        });
                                                        return { ...prev, different_time_enabled: newValue, start_times: newStartTimes, end_times: newEndTimes };
                                                    });
                                                } else {
                                                    setFormData(prev => ({ ...prev, different_time_enabled: newValue }));
                                                }
                                            } else {
                                                // Switching to "enabled" - prefill each selected day with unified/default times
                                                const baseStart = defaultStartTime();
                                                const baseEnd = defaultEndTime();
                                                // Persist to form data in HH:mm
                                                setFormData(prev => {
                                                    const newStartTimes: Record<string, string> = {};
                                                    const newEndTimes: Record<string, string> = {};
                                                    (prev.work_days || []).forEach(day => {
                                                        newStartTimes[day] = formatTimeHHmm(baseStart);
                                                        newEndTimes[day] = formatTimeHHmm(baseEnd);
                                                    });
                                                    return { ...prev, different_time_enabled: newValue, start_times: newStartTimes, end_times: newEndTimes };
                                                });
                                            }
                                        }}>
                                            <Text variant="h5" className="w-[310px]">Do these days have different start & end times?</Text>
                                        </Pressable>
                                        <View>
                                            <Switch
                                                checked={formData.different_time_enabled || false}
                                                onCheckedChange={(checked) => {
                                                    if (!checked) {
                                                        // Switching to "not enabled" - take times from first day and apply to all
                                                        const firstDay = formData.work_days?.[0];
                                                        if (firstDay && formData.start_times?.[firstDay] && formData.end_times?.[firstDay]) {
                                                            const startTime = formData.start_times[firstDay];
                                                            const endTime = formData.end_times[firstDay];
                                                            setFormData(prev => {
                                                                const newStartTimes: Record<string, string> = {};
                                                                const newEndTimes: Record<string, string> = {};
                                                                prev.work_days?.forEach(day => {
                                                                    newStartTimes[day] = startTime;
                                                                    newEndTimes[day] = endTime;
                                                                });
                                                                return { ...prev, different_time_enabled: checked, start_times: newStartTimes, end_times: newEndTimes };
                                                            });
                                                        } else {
                                                            setFormData(prev => ({ ...prev, different_time_enabled: checked }));
                                                        }
                                                    } else {
                                                        // Switching to "enabled" - prefill each selected day with unified/default times
                                                        const baseStart = defaultStartTime();
                                                        const baseEnd = defaultEndTime();
                                                        // Persist to form data in HH:mm
                                                        setFormData(prev => {
                                                            const newStartTimes: Record<string, string> = {};
                                                            const newEndTimes: Record<string, string> = {};
                                                            (prev.work_days || []).forEach(day => {
                                                                newStartTimes[day] = formatTimeHHmm(baseStart);
                                                                newEndTimes[day] = formatTimeHHmm(baseEnd);
                                                            });
                                                            return { ...prev, different_time_enabled: checked, start_times: newStartTimes, end_times: newEndTimes };
                                                        });
                                                    }
                                                }}
                                            />
                                        </View>
                                    </View>

                                    {formData.different_time_enabled ? (
                                        <View className="gap-6">
                                            {formData.work_days?.map((day, index) => {
                                                return (
                                                    <View key={index} className="gap-6 flex-row items-start justify-between">
                                                        <View className="w-[80px]">
                                                            <Text variant="h5">{capitalizeFirstLetter(day)}</Text>
                                                        </View>
                                                        <View className="flex-1 gap-4">
                                                            <View className="items-start gap-2 flex-1">
                                                                <Collapse title="Start Time">
                                                                    <View className="w-full">
                                                                        <TimePicker
                                                                            minuteInterval={15}
                                                                            className="w-full"
                                                                            selectedTime={formData.start_times?.[day] ? convertTimeToISOString(formData.start_times?.[day]) : defaultStartTime()}
                                                                            onTimeSelect={(time) => setFormData(prev => ({ ...prev, start_times: { ...prev.start_times, [day]: convertTimeToHHMMString(time) } }))}
                                                                        />
                                                                    </View>
                                                                </Collapse>
                                                            </View>
                                                            <View className="items-start gap-2 flex-1">
                                                                <Collapse title="End Time">
                                                                    <View className="w-full">
                                                                        <TimePicker
                                                                            minuteInterval={15}
                                                                            className="w-full"
                                                                            selectedTime={formData.end_times?.[day] ? convertTimeToISOString(formData.end_times?.[day]) : defaultEndTime()}
                                                                            onTimeSelect={(time) => setFormData(prev => ({ ...prev, end_times: { ...prev.end_times, [day]: convertTimeToHHMMString(time) } }))}
                                                                        />
                                                                    </View>
                                                                </Collapse>
                                                            </View>
                                                        </View>
                                                    </View>
                                                )
                                            })}
                                        </View>
                                    ) : (
                                        <View className="gap-6">
                                            <View className="items-start gap-2">
                                                <Collapse title="Start Time" textClassName="text-xl">
                                                    <View className="gap-2 w-full">
                                                        {(() => {
                                                            const firstDay = formData.work_days?.[0];
                                                            const startTimeString = firstDay ? (formData.start_times?.[firstDay] || '09:00') : '09:00';
                                                            return (
                                                                <TimePicker
                                                                    minuteInterval={15}
                                                                    className="w-full"
                                                                    selectedTime={convertTimeToISOString(startTimeString)}
                                                                    onTimeSelect={(time) => setAllStartTimes(time)}
                                                                />
                                                            );
                                                        })()}
                                                    </View>
                                                </Collapse>
                                            </View>
                                            <View className="items-start gap-2">
                                                <Collapse title="End Time" textClassName="text-xl">
                                                    <View className="gap-2 w-full">
                                                        {(() => {
                                                            const firstDay = formData.work_days?.[0];
                                                            const endTimeString = firstDay ? (formData.end_times?.[firstDay] || '17:00') : '17:00';
                                                            return (
                                                                <TimePicker
                                                                    minuteInterval={15}
                                                                    className="w-full"
                                                                    selectedTime={convertTimeToISOString(endTimeString)}
                                                                    onTimeSelect={(time) => setAllEndTimes(time)}
                                                                />
                                                            );
                                                        })()}
                                                    </View>
                                                </Collapse>
                                            </View>
                                        </View>
                                    )}

                                    <View className="gap-2">
                                        <Text variant="h5">Location</Text>
                                        <View className="gap-2 w-full">
                                            <DropdownPicker
                                                options={locationData.map((location: ArtistLocation) => ({ label: location.address, value: location.id ?? location.place_id })) || []}
                                                value={formData.location_id}
                                                onValueChange={(value: string) => setFormData({ ...formData, location_id: value as string })}
                                                placeholder="Select location"
                                                modalTitle="Select Location"
                                            />
                                        </View>
                                        <Button variant="outline" onPress={() => setOpenTempLocationModal(true)}>
                                            <Text variant='h5'>Add Temporary Location</Text>
                                            <Icon as={Plus} size={20} />
                                        </Button>
                                    </View>

                                    <View className="gap-2">
                                        <Text variant="h5">Notes</Text>
                                        <Textarea
                                            placeholder="Project Notes"
                                            className="min-h-28"
                                            value={formData.notes}
                                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                                        />
                                    </View>

                                    <Button onPress={handleSave} size="lg" disabled={loading}>
                                        <Text variant='h5'>{loading ? 'Saving...' : 'Save Changes'}</Text>
                                    </Button>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper >

                <LocationModal
                    visible={openTempLocationModal}
                    onClose={() => setOpenTempLocationModal(false)}
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
