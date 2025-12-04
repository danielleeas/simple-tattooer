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
import { Collapse } from "@/components/lib/collapse";
import { useAuth, useToast } from "@/lib/contexts";
import { Locations as ArtistLocation, Artist } from "@/lib/redux/types";
import { getAvailableDates, getAvailableTimes, getSessionById, createProjectSession, updateProjectSession, getMonthRange } from "@/lib/services/booking-service";
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

    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [renderStartTimes, setRenderStartTimes] = useState<{ id: number; time: string }[]>([]);
    const [loadingStartTimes, setLoadingStartTimes] = useState(false);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
    const [formData, setFormData] = useState<FormData>({
        sessionDate: undefined,
        sessionDuration: undefined,
        locationId: '',
        sessionStartTime: '',
    });
    const fetchSeqRef = useRef(0);
    const [saving, setSaving] = useState(false);
    const [sessionDateLoaded, setSessionDateLoaded] = useState(false);

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

    const handleHome = () => {
        router.dismissAll();
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

    const loadAvailabilityForMonth = async (year: number, monthZeroBased: number, locationId: string) => {
        setLoadingAvailability(true);
        setAvailableDates([]);
        try {
            if (!artist?.id || !locationId) return;
            const { start, end } = getMonthRange(year, monthZeroBased);
            const days = await getAvailableDates(artist, locationId, start, end);
            setAvailableDates(days);
        } catch (e) {
            console.warn('Failed to load availability:', e);
            setAvailableDates([]);
        } finally {
            setLoadingAvailability(false);
        }
    };

    const onChangeCalendarMonth = (year: number, month: number) => {
        setCalendarYear(year);
        setCalendarMonth(month);
    };

    useEffect(() => {
        if (!artist?.id || !formData.locationId) return;
        loadAvailabilityForMonth(calendarYear, calendarMonth, formData.locationId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [artist?.id, calendarYear, calendarMonth, formData.locationId]);

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
            if (!isNaN(dateObj.getTime())) {
                // Update calendar to show the month of the selected date
                setCalendarYear(dateObj.getFullYear());
                setCalendarMonth(dateObj.getMonth());
                setSessionDateLoaded(true);
            }
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
        if (!artist?.id || !formData.sessionDuration || !formData.locationId) return [];
        const toYmdLocal = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const da = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${da}`;
        };
        const ymd = toYmdLocal(date);
        const options = await getAvailableTimes(artist, ymd, formData.sessionDuration, artist?.flow?.break_time || 30, formData.locationId);
        const startTimes = options.map((opt, idx) => ({
            id: idx + 1,
            time: opt.label,
        }));
        return startTimes;
    }, [artist?.id, formData.sessionDuration, formData.locationId]);

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
                    artist: artist as Artist,
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
                    onLeftButtonPress={handleHome}
                    rightButtonImage={MENU_IMAGE}
                    rightButtonTitle="Menu"
                    onRightButtonPress={handleMenu}
                />
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
                                            onValueChange={(value: string) => {
                                                setFormData({ ...formData, locationId: value as string, sessionDate: undefined });
                                            }}
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
                                    <View className="relative">
                                        {loadingAvailability && (
                                            <View className="absolute top-16 right-1 bottom-1 left-1 bg-background/50 z-10 items-center justify-center">
                                                <ActivityIndicator size="small" color="#ffffff" />
                                                <Text className="text-text-secondary mt-2 text-sm">Checking availability...</Text>
                                            </View>
                                        )}
                                        {!loadingAvailability && availableDates.length === 0 && formData.locationId !== '' && (
                                            <View className="absolute top-16 right-1 bottom-1 left-1 bg-background/50 z-10 items-center justify-center">
                                                <Text className="text-text-secondary mt-2 text-sm">No availability found</Text>
                                            </View>
                                        )}
                                        <DatePicker
                                            key={sessionDateLoaded ? `session-${toYmdLocal(formData.sessionDate)}` : 'default'}
                                            selectedDateString={toYmdLocal(formData.sessionDate)}
                                            onDateStringSelect={(dateStr) => setFormData({ ...formData, sessionDate: parseYmdToLocalDate(dateStr) })}
                                            showInline={true}
                                            selectionMode="single"
                                            showTodayButton={false}
                                            availableDates={availableDates}
                                            onMonthChange={(y, m) => onChangeCalendarMonth(y, m)}
                                            disabled={formData.sessionDuration === undefined || formData.locationId === ''}
                                            className="border border-border-white rounded-lg p-4"
                                        />
                                    </View>
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
            </SafeAreaView>
        </>
    );
}
