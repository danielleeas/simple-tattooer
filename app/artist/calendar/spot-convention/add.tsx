import { useEffect, useState } from "react";
import { View, Pressable, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/lib/date-picker';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/lib/time-picker';
import { Plus } from 'lucide-react-native';
import { formatDate, convertTimeToHHMMString, convertTimeToISOString } from "@/lib/utils";
import { Collapse } from "@/components/lib/collapse";

import X_IMAGE from "@/assets/images/icons/x.png";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { useToast } from "@/lib/contexts/toast-context";
import { useAuth } from "@/lib/contexts/auth-context";
import { Locations } from "@/lib/redux/types";
import { LocationModal } from "@/components/lib/location-modal";
// import { addTemporaryLocation } from "@/lib/services/settings-service";
// import { createSpotConvention } from "@/lib/services/calendar-service";

export default function AddSpotConventionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { artist } = useAuth();

    // Form state
    const DEFAULT_START = '09:00';
    const DEFAULT_END = '17:00';

    const [loading, setLoading] = useState(false);
    const [locationData, setLocationData] = useState<Locations[]>([]);
    const [openTempLocationModal, setOpenTempLocationModal] = useState(false);
    const [formData, setFormData] = useState<{
        title: string;
        dates: string[];
        diffTimeEnabled: boolean;
        startTimes: Record<string, string>;
        endTimes: Record<string, string>;
        location: string;
        notes: string;
    }>({
        title: '',
        dates: [],
        diffTimeEnabled: false,
        startTimes: {},
        endTimes: {},
        location: '',
        notes: '',
    });

    useEffect(() => {
        if (artist?.locations) {
            setLocationData(artist.locations);
        }
    }, [artist?.locations]);

    // Helper functions for individual date time management
    const getDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDateKey = (key: string) => {
        const [yearStr, monthStr, dayStr] = key.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr) - 1;
        const day = Number(dayStr);
        return new Date(year, month, day);
    };

    const setAllStartTimes = (time: Date) => {
        setFormData(prev => {
            const newStartTimes: Record<string, string> = {};
            prev.dates?.forEach(dateKey => {
                newStartTimes[dateKey] = convertTimeToHHMMString(time);
            });
            return { ...prev, startTimes: newStartTimes };
        });
    };

    const setAllEndTimes = (time: Date) => {
        setFormData(prev => {
            const newEndTimes: Record<string, string> = {};
            prev.dates?.forEach(dateKey => {
                newEndTimes[dateKey] = convertTimeToHHMMString(time);
            });
            return { ...prev, endTimes: newEndTimes };
        });
    };

    const handleDatesSelect = (dates: Date[]) => {
        console.log('handleDatesSelect', dates);
        const newDateKeys = dates.map(getDateKey);
        setFormData(prev => {
            const prevFirstDateKey = prev.dates?.[0];
            const sharedStart = (prevFirstDateKey && prev.startTimes?.[prevFirstDateKey]) || DEFAULT_START;
            const sharedEnd = (prevFirstDateKey && prev.endTimes?.[prevFirstDateKey]) || DEFAULT_END;

            let startTimes: Record<string, string> = {};
            let endTimes: Record<string, string> = {};

            if (prev.diffTimeEnabled) {
                newDateKeys.forEach(dk => {
                    startTimes[dk] = prev.startTimes?.[dk] || DEFAULT_START;
                    endTimes[dk] = prev.endTimes?.[dk] || DEFAULT_END;
                });
            } else {
                newDateKeys.forEach(dk => {
                    startTimes[dk] = sharedStart;
                    endTimes[dk] = sharedEnd;
                });
            }

            return { ...prev, dates: newDateKeys, startTimes, endTimes };
        });
    };

    const handleLocationSelect = async (location: Locations) => {
        const locationData = {
            address: location.address,
            place_id: location.place_id,
            coordinates: location.coordinates,
            is_main_studio: false,
            is_temporary: true,
        };
        // const result = await addTemporaryLocation(artist.id, locationData);
        // if (!result.success) {
        //     toast({
        //         variant: 'error',
        //         title: 'Error',
        //         description: result.error || 'Failed to add temporary location',
        //     });
        // }
        // setLocationData((prev) => {
        //     const newLoc = result.location as ArtistLocation | undefined;
        //     if (!newLoc) return prev;
        //     const newKey = newLoc.id ?? newLoc.place_id;
        //     const exists = prev.some(l => (l.id ?? l.place_id) === newKey);
        //     return exists ? prev : [...prev, newLoc];
        // });
        // setFormData({ ...formData, location: result.location?.id ?? result.location?.place_id ?? '' });
        setOpenTempLocationModal(false);
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
        if (!formData.dates?.length) {
            toast({ variant: 'error', title: 'Select at least one date' });
            return;
        }
        if (!formData.location) {
            toast({ variant: 'error', title: 'Select a location' });
            return;
        }

        try {
            setLoading(true);
            // const result = await createSpotConvention({
            //     artistId: artist.id,
            //     title: formData.title.trim(),
            //     dates: formData.dates,
            //     diffTimeEnabled: formData.diffTimeEnabled,
            //     startTimes: formData.startTimes,
            //     endTimes: formData.endTimes,
            //     locationId: formData.location,
            //     notes: formData.notes?.trim() || undefined,
            // });
            // if (!result.success) {
            //     toast({ variant: 'error', title: 'Failed to add spot convention', description: result.error });
            //     return;
            // }

            toast({ variant: 'success', title: 'New Spot Convention Added!', duration: 3000 });
            router.dismissTo('/artist/calendar');

        } catch (error) {
            toast({ variant: 'error', title: 'Failed to add spot convention', description: error instanceof Error ? error.message : 'Unknown error' });
            return;
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
                            className="flex-1"
                        >
                            <View className="gap-6 pb-6">
                                <View className="flex-row items-start gap-4">
                                    <View className="h-6 w-6 rounded-xl bg-orange-500" />
                                    <Text variant="h4" className="leading-8">Add Guest Spot/ Convention</Text>
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
                                            selectedDates={formData.dates.map(parseDateKey)}
                                            onDatesSelect={handleDatesSelect}
                                            showInline={true}
                                            selectionMode="range"
                                            className="border border-border rounded-sm p-2"
                                        />
                                    </View>

                                    {formData.dates.length > 0 && (
                                        <>
                                            <View className="flex-row items-start gap-1">
                                                <Pressable
                                                    className="flex-1 gap-2"
                                                    onPress={() => {
                                                        const newValue = !formData.diffTimeEnabled;
                                                        if (!newValue) {
                                                            // Switching to not enabled: take times from first date and apply to all
                                                            const firstDateKey = formData.dates?.[0];
                                                            if (firstDateKey && formData.startTimes?.[firstDateKey] && formData.endTimes?.[firstDateKey]) {
                                                                const firstStart = formData.startTimes[firstDateKey];
                                                                const firstEnd = formData.endTimes[firstDateKey];
                                                                setFormData(prev => {
                                                                    const newStartTimes: Record<string, string> = {};
                                                                    const newEndTimes: Record<string, string> = {};
                                                                    prev.dates?.forEach(dk => {
                                                                        newStartTimes[dk] = firstStart;
                                                                        newEndTimes[dk] = firstEnd;
                                                                    });
                                                                    return { ...prev, diffTimeEnabled: newValue, startTimes: newStartTimes, endTimes: newEndTimes };
                                                                });
                                                            } else {
                                                                // No first-date times: set defaults for all selected dates
                                                                setFormData(prev => {
                                                                    const newStartTimes: Record<string, string> = {};
                                                                    const newEndTimes: Record<string, string> = {};
                                                                    prev.dates?.forEach(dk => {
                                                                        newStartTimes[dk] = DEFAULT_START;
                                                                        newEndTimes[dk] = DEFAULT_END;
                                                                    });
                                                                    return { ...prev, diffTimeEnabled: newValue, startTimes: newStartTimes, endTimes: newEndTimes };
                                                                });
                                                            }
                                                        } else {
                                                            // Enabling different times - user will set per-day times
                                                            setFormData(prev => {
                                                                const newStartTimes: Record<string, string> = { ...(prev.startTimes || {}) };
                                                                const newEndTimes: Record<string, string> = { ...(prev.endTimes || {}) };
                                                                prev.dates?.forEach(dk => {
                                                                    if (!newStartTimes[dk]) newStartTimes[dk] = DEFAULT_START;
                                                                    if (!newEndTimes[dk]) newEndTimes[dk] = DEFAULT_END;
                                                                });
                                                                return { ...prev, diffTimeEnabled: newValue, startTimes: newStartTimes, endTimes: newEndTimes };
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <Text variant="h5" className="w-[310px]">Do these days have different start & end hours?</Text>
                                                </Pressable>
                                                <View>
                                                    <Switch
                                                        checked={formData.diffTimeEnabled}
                                                        onCheckedChange={(checked) => {
                                                            if (!checked) {
                                                                const firstDateKey = formData.dates?.[0];
                                                                if (firstDateKey && formData.startTimes?.[firstDateKey] && formData.endTimes?.[firstDateKey]) {
                                                                    const firstStart = formData.startTimes[firstDateKey];
                                                                    const firstEnd = formData.endTimes[firstDateKey];
                                                                    setFormData(prev => {
                                                                        const newStartTimes: Record<string, string> = {};
                                                                        const newEndTimes: Record<string, string> = {};
                                                                        prev.dates?.forEach(dk => {
                                                                            newStartTimes[dk] = firstStart;
                                                                            newEndTimes[dk] = firstEnd;
                                                                        });
                                                                        return { ...prev, diffTimeEnabled: checked, startTimes: newStartTimes, endTimes: newEndTimes };
                                                                    });
                                                                } else {
                                                                    setFormData(prev => {
                                                                        const newStartTimes: Record<string, string> = {};
                                                                        const newEndTimes: Record<string, string> = {};
                                                                        prev.dates?.forEach(dk => {
                                                                            newStartTimes[dk] = DEFAULT_START;
                                                                            newEndTimes[dk] = DEFAULT_END;
                                                                        });
                                                                        return { ...prev, diffTimeEnabled: checked, startTimes: newStartTimes, endTimes: newEndTimes };
                                                                    });
                                                                }
                                                            } else {
                                                                setFormData(prev => {
                                                                    const newStartTimes: Record<string, string> = { ...(prev.startTimes || {}) };
                                                                    const newEndTimes: Record<string, string> = { ...(prev.endTimes || {}) };
                                                                    prev.dates?.forEach(dk => {
                                                                        if (!newStartTimes[dk]) newStartTimes[dk] = DEFAULT_START;
                                                                        if (!newEndTimes[dk]) newEndTimes[dk] = DEFAULT_END;
                                                                    });
                                                                    return { ...prev, diffTimeEnabled: checked, startTimes: newStartTimes, endTimes: newEndTimes };
                                                                });
                                                            }
                                                        }}
                                                    />
                                                </View>
                                            </View>

                                            {formData.diffTimeEnabled ? (
                                                <View className="gap-6">
                                                    {formData.dates.map((dateString, index) => {
                                                        const date = parseDateKey(dateString);
                                                        const dateKey = getDateKey(date);
                                                        return (
                                                            <View key={index} className="gap-6 flex-row items-start justify-between">
                                                                <View className="w-[80px]">
                                                                    <Text variant="h5">{formatDate(date, false, true)}</Text>
                                                                </View>
                                                                <View className="flex-1 gap-4">
                                                                    <View className="items-start gap-2 flex-1">
                                                                        <Collapse title="Start Time">
                                                                            <View className="w-full">
                                                                                <TimePicker
                                                                                    minuteInterval={15}
                                                                                    className="w-full"
                                                                                    selectedTime={formData.startTimes?.[dateKey] ? convertTimeToISOString(formData.startTimes[dateKey]) : new Date()}
                                                                                    onTimeSelect={(time) => setFormData(prev => ({ ...prev, startTimes: { ...prev.startTimes, [dateKey]: convertTimeToHHMMString(time) } }))}
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
                                                                                    selectedTime={formData.endTimes?.[dateKey] ? convertTimeToISOString(formData.endTimes[dateKey]) : new Date()}
                                                                                    onTimeSelect={(time) => setFormData(prev => ({ ...prev, endTimes: { ...prev.endTimes, [dateKey]: convertTimeToHHMMString(time) } }))}
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
                                                                    const firstDateKey = formData.dates?.[0];
                                                                    const startTimeString = firstDateKey ? (formData.startTimes?.[firstDateKey] || '09:00') : '09:00';
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
                                                                    const firstDateKey = formData.dates?.[0];
                                                                    const endTimeString = firstDateKey ? (formData.endTimes?.[firstDateKey] || '17:00') : '17:00';
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
                                        </>
                                    )}

                                    <View className="gap-2">
                                        <Text variant="h5">Location</Text>
                                        <View className="gap-2 w-full">
                                            <DropdownPicker
                                                options={locationData.map((location: Locations) => ({ label: location.address, value: location.id ?? location.place_id })) || []}
                                                value={formData.location}
                                                onValueChange={(value: string) => setFormData({ ...formData, location: value as string })}
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
                                        <Text variant='h5'>{loading ? 'Adding...' : 'Add to Calendar'}</Text>
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
