import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Image, Pressable, ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { DatePicker } from '@/components/lib/date-picker';
import { TimeDurationPicker } from '@/components/lib/time-duration-picker';
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Collapse } from "@/components/lib/collapse";
import { useAuth, useToast } from "@/lib/contexts";
import { Locations as ArtistLocation } from "@/lib/redux/types";
import { getAvailableDates, getAvailableTimes, getSessionById, createProjectSession, updateProjectSession } from "@/lib/services/booking-service";
import { formatDbDate } from "@/lib/utils";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";


interface FormData {
    sessionDate: Date | undefined;
    sessionDuration: number | undefined;
    locationId: string;
    sessionStartTime: string;
}

export default function ClientEditSession() {
    const { projectId, sessionId } = useLocalSearchParams();
    const { artist } = useAuth();
    const { toast } = useToast();
    const [startTimeOpened, setStartTimeOpened] = useState<boolean>(false);

    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [renderStartTimes, setRenderStartTimes] = useState<{ id: number; time: string }[]>([]);
    const [loadingStartTimes, setLoadingStartTimes] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        sessionDate: undefined,
        sessionDuration: undefined,
        locationId: '',
        sessionStartTime: '',
    });
    const fetchSeqRef = useRef(0);
    const [saving, setSaving] = useState(false);

    const toDisplayTime = useCallback((hhmm?: string): string => {
        if (!hhmm) return '';
        const [hStr, mStr] = String(hhmm).split(':');
        let h = Number(hStr);
        const m = Number(mStr);
        if (Number.isNaN(h) || Number.isNaN(m)) return '';
        const period = h < 12 ? 'AM' : 'PM';
        const h12 = ((h + 11) % 12) + 1;
        return `${h12}:${String(m).padStart(2, '0')} ${period}`;
    }, []);

    const handleBack = () => {
        router.back();
    };

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    const makeChunks = (arr: { id: number; time: string }[]) => {
        const chunks: { id: number; time: string }[][] = [];
        for (let i = 0; i < arr.length; i += 2) {
            chunks.push(arr.slice(i, i + 2));
        }
        return chunks;
    };

    const startTimesChunks = useMemo(() => makeChunks(renderStartTimes), [renderStartTimes]);

    // Helpers for month boundaries
    const getMonthRange = (year: number, monthZeroBased: number) => {
        const start = new Date(year, monthZeroBased, 1);
        const end = new Date(year, monthZeroBased + 1, 0);
        const toYmd = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const da = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${da}`;
        };
        return { start: toYmd(start), end: toYmd(end) };
    };

    // Local date helpers for DatePicker (expects YYYY-MM-DD strings)
    const toYmdLocal = (date?: Date): string | undefined => {
        if (!date) return undefined;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const parseYmdToLocalDate = (ymd?: string): Date | undefined => {
        if (!ymd) return undefined;
        const [y, m, d] = ymd.split('-').map(Number);
        if (!y || !m || !d) return undefined;
        return new Date(y, m - 1, d, 12);
    };

    const loadAvailabilityForMonth = async (year: number, monthZeroBased: number) => {
        try {
            if (!artist?.id) return;
            const { start, end } = getMonthRange(year, monthZeroBased);
            const days = await getAvailableDates(artist, undefined, start, end);
            setAvailableDates(days);
        } catch (e) {
            console.warn('Failed to load availability:', e);
            setAvailableDates([]);
        }
    };

    // Initial month load
    useEffect(() => {
        const today = new Date();
        loadAvailabilityForMonth(today.getFullYear(), today.getMonth());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [artist?.id]);

    // Preload existing session details
    useEffect(() => {
        (async () => {
            if (!sessionId) return;
            const sid = String(sessionId);
            const result = await getSessionById(sid);
            if (!result.success || !result.data) {
                return;
            }
            const d = result.data;
            const dateObj = new Date(`${d.date}T00:00:00`);
            setFormData({
                sessionDate: isNaN(dateObj.getTime()) ? undefined : dateObj,
                sessionDuration: Number(d.duration) || undefined,
                locationId: String(d.location_id || ''),
                sessionStartTime: toDisplayTime(d.start_time),
            });
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const startTimesForDate = useCallback(async (date: Date) => {
        if (!artist?.id || !formData.sessionDuration) return [];
        const toYmdLocal = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const da = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${da}`;
        };
        const ymd = toYmdLocal(date);
        const options = await getAvailableTimes(artist, ymd, formData.sessionDuration, 30);
        const startTimes = options.map((opt, idx) => ({
            id: idx + 1,
            time: opt.label,
        }));
        return startTimes;
    }, [artist?.id, formData.sessionDuration]);

    useEffect(() => {
        let alive = true;
        const seq = ++fetchSeqRef.current;
        (async () => {
            if (!formData.sessionDate || !artist?.id || !formData.sessionDuration || !formData.locationId) {
                setRenderStartTimes((prev) => (prev.length ? [] : prev));
                if (alive && seq === fetchSeqRef.current) setLoadingStartTimes(false);
                return;
            }
            if (alive && seq === fetchSeqRef.current) setLoadingStartTimes(true);
            try {
                const times = await startTimesForDate(formData.sessionDate);
                if (!alive || seq !== fetchSeqRef.current) return;
                setRenderStartTimes(times);
            } finally {
                if (alive && seq === fetchSeqRef.current) setLoadingStartTimes(false);
            }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.sessionDate, formData.sessionDuration, formData.locationId, artist?.id]);

    const handleSave = async () => {
        if (saving) return;
        try {
            const pid = String(projectId || '');
            if (!pid) {
                toast({ variant: 'error', title: 'Missing project' });
                return;
            }
            if (!formData.sessionDuration) {
                toast({ variant: 'error', title: 'Select session length' });
                return;
            }
            if (!formData.locationId) {
                toast({ variant: 'error', title: 'Select location' });
                return;
            }
            if (!formData.sessionDate) {
                toast({ variant: 'error', title: 'Select date' });
                return;
            }
            if (!formData.sessionStartTime?.trim()) {
                toast({ variant: 'error', title: 'Select start time' });
                return;
            }

            setSaving(true);

            // If sessionId is present, update existing session; otherwise fallback to create
            let ok = true;
            if (sessionId) {
                const upd = await updateProjectSession({
                    sessionId: String(sessionId),
                    date: formData.sessionDate as Date,
                    startTimeDisplay: formData.sessionStartTime,
                    sessionLengthMinutes: formData.sessionDuration as number,
                    locationId: formData.locationId,
                });
                ok = upd.success;
                if (!ok) {
                    toast({
                        variant: 'error',
                        title: 'Failed to update session',
                        description: upd.error || 'Please try again',
                        duration: 3000,
                    });
                    return;
                }
                toast({
                    variant: 'success',
                    title: 'Session updated',
                    duration: 2000,
                });
            } else {
                const result = await createProjectSession({
                    projectId: pid,
                    date: formData.sessionDate,
                    startTimeDisplay: formData.sessionStartTime,
                    sessionLengthMinutes: formData.sessionDuration,
                    locationId: formData.locationId,
                });
                if (!result.success) {
                    toast({
                        variant: 'error',
                        title: 'Failed to add session',
                        description: result.error || 'Please try again',
                        duration: 3000,
                    });
                    return;
                }
                toast({
                    variant: 'success',
                    title: 'Session added',
                    duration: 2000,
                });
            }
            router.back();
        } catch (e: any) {
            toast({
                variant: 'error',
                title: 'Unexpected error',
                description: e?.message || 'Please try again',
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={HOME_IMAGE}
                    leftButtonTitle="Home"
                    onLeftButtonPress={handleBack}
                    rightButtonImage={MENU_IMAGE}
                    rightButtonTitle="Menu"
                    onRightButtonPress={handleMenu}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                        <View className="flex-1">
                            <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false}>
                                <View className="gap-6 pb-6">
                                    <View className="items-center justify-center pb-[16px] h-[120px]">
                                        <Image
                                            source={require('@/assets/images/icons/appointment.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Edit Session</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Detail</Text>
                                    </View>

                                    <View className="items-start gap-2">
                                        <Collapse title="Session length" textClassName="text-xl">
                                            <TimeDurationPicker
                                                selectedDuration={formData.sessionDuration}
                                                onDurationSelect={(duration) => setFormData({ ...formData, sessionDuration: duration })}
                                                minuteInterval={15}
                                                minDuration={15}
                                                maxDuration={525}
                                                modalTitle="Select Session Duration"
                                            />
                                        </Collapse>
                                    </View>

                                    <View className="items-start gap-2">
                                        <Collapse title="Location" textClassName="text-xl">
                                            <DropdownPicker
                                                options={artist?.locations?.map((location: ArtistLocation) => ({ label: location.address, value: location.id ?? location.place_id })) || []}
                                                value={formData.locationId}
                                                onValueChange={(value: string) => setFormData({ ...formData, locationId: value as string })}
                                                placeholder="Select location"
                                                modalTitle="Select Location"
                                                disabled={formData.sessionDuration === undefined}
                                            />
                                            {formData.sessionDuration === undefined && (
                                                <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                                    Please add session length first
                                                </Text>
                                            )}
                                        </Collapse>
                                    </View>

                                    <View className="gap-2">
                                        <Text variant="h5">Choose Date</Text>
                                        <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                            Tap on date to view start times
                                        </Text>
                                        <DatePicker
                                            selectedDateString={toYmdLocal(formData.sessionDate)}
                                            onDateStringSelect={(dateStr) => setFormData({ ...formData, sessionDate: parseYmdToLocalDate(dateStr) })}
                                            showInline={true}
                                            selectionMode="single"
                                            availableDates={availableDates}
                                            onMonthChange={(y, m) => loadAvailabilityForMonth(y, m)}
                                            disabled={formData.sessionDuration === undefined || formData.locationId === ''}
                                            className="border border-border-white rounded-lg p-4"
                                        />
                                        {(formData.sessionDuration === undefined && formData.locationId === '') && (
                                            <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                                Please add session length and location first
                                            </Text>
                                        )}
                                    </View>

                                    <View className="items-start gap-2">
                                        <View className="w-full flex-row items-center justify-between">
                                            <Text variant="h5">Start Time</Text>
                                        </View>
                                        <View className="gap-2 w-full">
                                            {formData.sessionDate && (
                                                <View className="gap-2">
                                                    <View className="gap-2">
                                                        <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                                            Selected date - {formData.sessionDate ? formatDbDate(formData.sessionDate, 'MMM DD, YYYY') : ''}
                                                        </Text>
                                                    </View>
                                                    <View className="gap-2">
                                                        {loadingStartTimes ? (
                                                            <View className="items-center justify-center py-4">
                                                                <ActivityIndicator size="small" color="#ffffff" />
                                                                <Text variant="small" className="text-text-secondary mt-2">Loading times...</Text>
                                                            </View>
                                                        ) : (
                                                            (() => {
                                                                if (renderStartTimes.length === 0) {
                                                                    return (
                                                                        <View className="items-center justify-center py-4">
                                                                            <Text variant="small" className="text-text-secondary">No available start times</Text>
                                                                        </View>
                                                                    );
                                                                }
                                                                return (
                                                                    <View className="gap-2">
                                                                        {startTimesChunks.map((times, index) => (
                                                                            <View key={index} className="flex-row items-center gap-2">
                                                                                {times.map((time) => (
                                                                                    <Pressable
                                                                                        key={time.id}
                                                                                        onPress={() => setFormData({ ...formData, sessionStartTime: time.time })}
                                                                                        className={`rounded-full border border-border-white items-center justify-center h-8 flex-1 ${formData.sessionStartTime === time.time ? 'bg-foreground' : ''}`}
                                                                                    >
                                                                                        <Text variant="small" className={formData.sessionStartTime === time.time ? 'text-black' : 'text-text-secondary'}>{time.time}</Text>
                                                                                    </Pressable>
                                                                                ))}
                                                                            </View>
                                                                        ))}
                                                                    </View>
                                                                );
                                                            })()
                                                        )}
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>

                        <View className="gap-4 items-center justify-center flex-row">
                            <Button onPress={handleBack} variant="outline" size="lg" className="flex-1">
                                <Text variant='h5'>Cancel</Text>
                            </Button>
                            <Button variant="outline" onPress={handleSave} size="lg" className="flex-1" disabled={saving}>
                                <Text variant='h5'>Save</Text>
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
