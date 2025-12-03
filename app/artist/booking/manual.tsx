import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { View, Image, Pressable, ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from "expo-router";

import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { DatePicker } from '@/components/lib/date-picker';
import { TimeDurationPicker } from '@/components/lib/time-duration-picker';
import { Textarea } from "@/components/ui/textarea";
import { DollarSignIcon } from "lucide-react-native";
import { Note } from "@/components/ui/note";
import { Input } from "@/components/ui/input";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { Locations as ArtistLocation } from "@/lib/redux/types";
import { useAuth, useToast } from "@/lib/contexts";
import { getAvailableDates, getAvailableTimes, createManualBooking, sendManualBookingRequestEmail } from "@/lib/services/booking-service";
import { Collapse } from "@/components/lib/collapse";
import { formatDbDate } from "@/lib/utils";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

interface FormDataProps {
    title: string;
    sessionLength: number | undefined;
    locationId: string;
    date: Date | undefined;
    startTime: string;
    depositAmount: string;
    sessionRate: string;
    notes: string;
}

export default function ManualBooking() {
    const { toast } = useToast();
    const { artist } = useAuth();
    const { clientId } = useLocalSearchParams();
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [renderStartTimes, setRenderStartTimes] = useState<{ id: number; time: string }[]>([]);
    const fetchSeqRef = useRef(0);
    const [loadingStartTimes, setLoadingStartTimes] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const shallowEqualTimes = (a: { id: number; time: string }[], b: { id: number; time: string }[]) => {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].time !== b[i].time) return false;
        }
        return true;
    };

    const [formData, setFormData] = useState<FormDataProps>({
        title: '',
        sessionLength: undefined,
        locationId: '',
        date: undefined,
        startTime: '',
        depositAmount: '',
        sessionRate: '',
        notes: '',
    });

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    // Helpers to convert between Date and YYYY-MM-DD (local) expected by DatePicker
    const formatDateToYmd = useCallback((date?: Date) => {
        if (!date) return undefined;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);

    const parseYmdToLocalDate = useCallback((ymd?: string) => {
        if (!ymd) return undefined;
        const [y, m, d] = ymd.split('-').map(Number);
        if (!y || !m || !d) return undefined;
        return new Date(y, m - 1, d, 12); // local noon to avoid TZ shifts
    }, []);

    const makeChunks = (arr: { id: number; time: string }[]) => {
        const chunks: { id: number; time: string }[][] = [];
        // Create chunks of 2 objects each
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

    const loadAvailabilityForMonth = async (year: number, monthZeroBased: number) => {
        try {
            if (!artist?.id) return;
            const { start, end } = getMonthRange(year, monthZeroBased);
            const days = await getAvailableDates(artist as any, clientId as string | undefined, start, end);
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

    const startTimesForDate = useCallback(async (date: Date) => {
        if (!artist?.id || !formData.sessionLength) return [];
        const toYmdLocal = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const da = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${da}`;
        };
        const ymd = toYmdLocal(date);
        const options = await getAvailableTimes(artist as any, ymd, formData.sessionLength, 30);
        const startTimes = options.map((opt, idx) => ({
            id: idx + 1,
            time: opt.label,
        }));
        return startTimes;
    }, [artist?.id, formData.sessionLength]);

    useEffect(() => {
        let alive = true;
        const seq = ++fetchSeqRef.current;
        (async () => {
            if (!formData.date || !artist?.id || !formData.sessionLength || !formData.locationId) {
                setRenderStartTimes((prev) => (prev.length ? [] : prev));
                if (alive && seq === fetchSeqRef.current) setLoadingStartTimes(false);
                return;
            }
            if (alive && seq === fetchSeqRef.current) setLoadingStartTimes(true);
            try {
                const times = await startTimesForDate(formData.date);
                if (!alive || seq !== fetchSeqRef.current) return;
                setRenderStartTimes((prev) => (shallowEqualTimes(prev, times) ? prev : times));
            } finally {
                if (alive && seq === fetchSeqRef.current) setLoadingStartTimes(false);
            }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.date, formData.sessionLength, formData.locationId, artist?.id]);

    const handleCompleteBooking = async () => {
        try {
            setSubmitting(true);
            if (!artist?.id) {
                toast({ variant: 'error', title: 'Missing artist session' });
                return;
            }
            const depositAmount = parseInt(formData.depositAmount);
            const sessionRate = parseInt(formData.sessionRate);

            const result = await createManualBooking({
                artistId: artist.id,
                clientId: String(clientId || ''),
                title: formData.title,
                sessionLengthMinutes: formData.sessionLength || 0,
                locationId: formData.locationId,
                date: formData.date as Date,
                startTimeDisplay: formData.startTime,
                depositAmount,
                sessionRate,
                notes: formData.notes,
            });

            if (!result.success) {
                toast({
                    variant: 'error',
                    title: 'Failed to create booking',
                    description: result.error || 'Please try again',
                    duration: 3000,
                });
                return;
            }

            // Send manual booking request approval email (non-blocking) via service
            void sendManualBookingRequestEmail({
                artist: artist as any,
                clientId: String(clientId || ''),
                form: {
                    title: formData.title,
                    date: formData.date as Date,
                    startTime: formData.startTime,
                    sessionLength: formData.sessionLength || 0,
                    notes: formData.notes,
                    locationId: formData.locationId,
                    depositAmount,
                    sessionRate,
                },
            });

            toast({
                variant: 'success',
                title: 'Booking Created!',
                description: 'Waiting for client response to pay deposit',
                duration: 3000,
            });
            router.push('/');
        } catch (e: any) {
            toast({
                variant: 'error',
                title: 'Unexpected error',
                description: e?.message || 'Please try again',
                duration: 3000,
            });
        } finally {
            setSubmitting(false);
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
                        <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View className="gap-6 pb-6">
                                <View className="items-center justify-center pb-[22px] h-[180px]">
                                    <Image
                                        source={require('@/assets/images/icons/appointment.png')}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Create</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Quote</Text>
                                    <Text className="text-center mt-2 text-text-secondary">Pick the dates and</Text>
                                    <Text className="text-center text-text-secondary leading-none">times for this project.</Text>
                                </View>

                                <Note
                                    message="Only use  manual  booking  if  you  have confirmed the  dates with  the  client.  Get rid of the back forth."
                                />

                                <View className="gap-2">
                                    <Text variant="h5">Project Title</Text>
                                    <Input
                                        value={formData.title}
                                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                                    />
                                </View>

                                <View className="items-start gap-2">
                                    <Collapse title="Session Length" textClassName="text-xl">
                                        <TimeDurationPicker
                                            selectedDuration={formData.sessionLength}
                                            onDurationSelect={(duration) => setFormData({ ...formData, sessionLength: duration })}
                                            minuteInterval={15}
                                            minDuration={15}
                                            maxDuration={525}
                                            disabled={formData.title === ''}
                                            modalTitle="Select Session Duration"
                                        />
                                        {formData.title === '' && (
                                            <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                                Please add project title first
                                            </Text>
                                        )}
                                    </Collapse>
                                </View>

                                <View className="items-start gap-2">
                                    <Collapse title="Location" textClassName="text-xl">
                                        <DropdownPicker
                                            options={artist?.locations?.map((location: ArtistLocation) => ({ label: location.address, value: (location as any).id ?? (location as any).place_id })) || []}
                                            value={formData.locationId}
                                            onValueChange={(value: string) => setFormData({ ...formData, locationId: value as string })}
                                            placeholder="Select location"
                                            modalTitle="Select Location"
                                            disabled={formData.sessionLength === undefined}
                                        />
                                        {formData.sessionLength === undefined && (
                                            <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                                Please add session length first
                                            </Text>
                                        )}
                                    </Collapse>
                                </View>
                                <View className="gap-2">
                                    <Text variant="h4">Choose Dates</Text>
                                    <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                        Tap on date(s) to view start times(s)
                                    </Text>
                                </View>

                                <DatePicker
                                    selectedDateString={formatDateToYmd(formData.date)}
                                    onDateStringSelect={(dateStr) => setFormData({ ...formData, date: parseYmdToLocalDate(dateStr) })}
                                    showInline={true}
                                    selectionMode="single"
                                    availableDates={availableDates}
                                    onMonthChange={(y, m) => loadAvailabilityForMonth(y, m)}
                                    disabled={formData.sessionLength === undefined || formData.locationId === ''}
                                    className="border border-border-white rounded-lg p-4"
                                />

                                {(formData.sessionLength === undefined && formData.locationId === '') && (
                                    <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                        Please add session length and location first
                                    </Text>
                                )}

                                {formData.date && (
                                    <View className="gap-2">
                                        <View className="gap-2">
                                            <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                                Selected date - {formData.date ? formatDbDate(formData.date, 'MMM DD, YYYY') : ''}
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
                                                    const toYmdLocal = (d: Date) => {
                                                        const y = d.getFullYear();
                                                        const m = String(d.getMonth() + 1).padStart(2, '0');
                                                        const da = String(d.getDate()).padStart(2, '0');
                                                        return `${y}-${m}-${da}`;
                                                    };
                                                    const dateKey = formData.date ? toYmdLocal(formData.date) : '';
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
                                                                            onPress={() => setFormData((prev) => ({ ...prev, startTime: time.time }))}
                                                                            className={`rounded-full border border-border-white items-center justify-center h-8 flex-1 ${formData.startTime === time.time ? 'bg-foreground' : ''}`}
                                                                        >
                                                                            <Text variant="small" className={formData.startTime === time.time ? 'text-black' : 'text-text-secondary'}>{time.time}</Text>
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

                                <View className="flex-row items-center justify-between gap-3">
                                    <View className="flex-1 gap-2">
                                        <Text variant="h5">Deposit Amount</Text>
                                        <Input value={formData.depositAmount} onChangeText={(text) => setFormData({ ...formData, depositAmount: text })} leftIcon={DollarSignIcon} />
                                    </View>
                                    <View className="flex-1 gap-2">
                                        <Text variant="h5">Session rate</Text>
                                        <Input value={formData.sessionRate} onChangeText={(text) => setFormData({ ...formData, sessionRate: text })} leftIcon={DollarSignIcon} />
                                    </View>
                                </View>

                                <View className="gap-2">
                                    <Textarea
                                        placeholder="Project Notes"
                                        className="min-h-28"
                                        value={formData.notes}
                                        onChangeText={(text) => setFormData({ ...formData, notes: text })}
                                    />
                                    <Text variant="small" className="font-thin leading-5 text-text-secondary">These  notes  will  be  sent  to  the  client</Text>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>

                    <View className="gap-4 items-center justify-center">
                        <Button variant="outline" onPress={handleCompleteBooking} size="lg" className="w-full" disabled={submitting}>
                            {submitting ? (
                                <View className="flex-row items-center justify-center gap-2">
                                    <ActivityIndicator size="small" color="#000000" />
                                    <Text variant='h5'>Creating...</Text>
                                </View>
                            ) : (
                                <Text variant='h5'>Send Quote & Deposit</Text>
                            )}
                        </Button>
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
}
