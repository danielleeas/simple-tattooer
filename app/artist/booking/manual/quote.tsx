import React, { useState, useEffect, useMemo } from "react";
import { View, Image, ActivityIndicator } from "react-native";
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
import { Collapse } from "@/components/lib/collapse";
import { createClientWithAuth } from "@/lib/services/clients-service";
import { getAvailableDates, getBackToBackResult, getMonthRange, createManualBooking, sendManualBookingRequestEmail, getAvailableDatesManualBooking } from "@/lib/services/booking-service";
import { calculateEndTime, formatDbDate, normalizeDateParamToYmd, parseYmdFromDb } from "@/lib/utils";
import { StartTimes } from "@/components/pages/booking/start-times";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import { checkEventOverlap } from "@/lib/services/calendar-service";

interface FormDataProps {
    title: string;
    sessionLength: number | undefined;
    locationId: string;
    dates: string[]; // YYYY-MM-DD format strings
    startTimes: Record<string, string>;
    depositAmount: string;
    sessionRate: string;
    notes: string;
}

export default function QuoteBooking() {
    const { toast } = useToast();
    const { artist } = useAuth();
    const { clientId, full_name, email, phone_number, project_notes } = useLocalSearchParams();
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormDataProps>({
        title: '',
        sessionLength: undefined,
        locationId: '',
        dates: [],
        startTimes: {},
        depositAmount: '',
        sessionRate: '',
        notes: '',
    });

    const locationOptions = useMemo(
        () => {
            if (!artist?.locations) return [];

            // Build a "today" Date in local time (no implicit UTC conversion)
            const now = new Date();
            const todayLocal = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                12,
                0,
                0,
                0
            );

            return artist.locations
                .filter((location: ArtistLocation) => {
                    if (!location.end_at) return true;
                    const end = parseYmdFromDb(String(location.end_at));
                    if (!end || isNaN(end.getTime())) return true;
                    // Hide locations whose end date is already past "today" (local time)
                    return todayLocal <= end;
                })
                .map((location: ArtistLocation) => ({
                    label: location.address,
                    value: (location as any).id ?? (location as any).place_id
                }));
        },
        [artist?.locations]
    );

    const loadAvailabilityForMonth = async (year: number, monthZeroBased: number, locationId: string) => {
        setLoadingAvailability(true);
        setAvailableDates([]);
        try {
            if (!artist?.id || !locationId) return;
            const { start, end } = getMonthRange(year, monthZeroBased);
            const days = await getAvailableDatesManualBooking(artist as any, locationId, start, end);
            console.log(days);
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
    }

    const onChangeLocation = (locationId: string) => {
        setFormData((prev) => ({ ...prev, locationId: locationId, dates: [] }));
    }

    const handleDatesSelect = (dates: string[]) => {
        const sortedDates = [...dates].sort();
        // Remove start times for dates that are no longer selected
        const updatedStartTimes = { ...formData.startTimes };
        Object.keys(updatedStartTimes).forEach(date => {
            if (!sortedDates.includes(date)) {
                delete updatedStartTimes[date];
            }
        });
        setFormData((prev) => ({ ...prev, dates: sortedDates, startTimes: updatedStartTimes }));
    }

    const handleTimeSelect = (date: string, time: string) => {
        setFormData((prev) => ({
            ...prev,
            startTimes: {
                ...prev.startTimes,
                [date]: time
            }
        }));
    }

    useEffect(() => {
        if (!artist?.id || !formData.locationId) return;
        loadAvailabilityForMonth(calendarYear, calendarMonth, formData.locationId);
    }, [artist?.id, calendarYear, calendarMonth, formData.locationId]);

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    const handleCompleteBooking = async () => {
        try {
            setSubmitting(true);
            if (!artist?.id) {
                toast({ variant: 'error', title: 'Missing artist session' });
                return;
            }
            const depositAmount = parseInt(formData.depositAmount);
            const sessionRate = parseInt(formData.sessionRate);

            if (formData.dates.length === 0) {
                toast({ variant: 'error', title: 'Please select at least one date' });
                return;
            }

            // const backToBackResult = await getBackToBackResult(artist, formData.dates);
            // if (!backToBackResult.success) {
            //     toast({ variant: 'error', title: backToBackResult.error || 'Failed to check back to back' });
            //     return;
            // }

            for (const date of formData.dates) {
                const dateStr = normalizeDateParamToYmd(date || undefined);
                const overlapCheck = await checkEventOverlap({
                    artistId: artist.id,
                    date: dateStr,
                    startTime: formData.startTimes[date],
                    endTime: calculateEndTime(formData.startTimes[date], formData.sessionLength || 0),
                    break_time: (artist?.flow as any)?.break_time || 0,
                    source: 'manual',
                });
                if (!overlapCheck.success) {
                    toast({ variant: 'error', title: overlapCheck.error || 'Failed to check for conflicts', duration: 3000 });
                    return;
                }
                if (overlapCheck.hasOverlap) {
                    toast({ variant: 'error', title: 'Time conflict detected', description: `This time overlaps with an existing event: ${overlapCheck.overlappingEvent?.title || 'Unknown'}`, duration: 3000 });
                    return;
                }
            }

            // Ensure we have a client; create one if not provided via params
            let resolvedClientId = String(clientId || '');
            if (!resolvedClientId) {
                const nameVal = typeof full_name === 'string' ? full_name : '';
                const emailVal = typeof email === 'string' ? email : '';
                const phoneVal = typeof phone_number === 'string' ? phone_number : '';
                const notesVal = typeof project_notes === 'string' ? project_notes : null;

                if (!nameVal.trim() || !emailVal.trim() || !phoneVal.trim()) {
                    toast({
                        variant: 'error',
                        title: 'Missing client info',
                        description: 'Full name, email, and phone are required.',
                        duration: 3000,
                    });
                    return;
                }

                const created = await createClientWithAuth({
                    full_name: nameVal,
                    email: emailVal,
                    phone_number: phoneVal,
                    project_notes: notesVal,
                    artist_id: artist.id,
                });

                if (!created?.success) {
                    toast({
                        variant: 'error',
                        title: 'Failed to create client',
                        description: created?.error || 'Please try again',
                        duration: 3000,
                    });
                    return;
                }

                resolvedClientId = created.client.id;
            }

            const result = await createManualBooking({
                artistId: artist.id,
                clientId: resolvedClientId,
                title: formData.title,
                sessionLengthMinutes: formData.sessionLength || 0,
                locationId: formData.locationId,
                dates: formData.dates,
                startTimes: formData.startTimes,
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
                clientId: resolvedClientId,
                form: {
                    title: formData.title,
                    dates: formData.dates,
                    startTimes: formData.startTimes,
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
                        <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false} >
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
                                            options={locationOptions}
                                            value={formData.locationId}
                                            onValueChange={(value: string) => onChangeLocation(value as string)}
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
                                        selectedDatesStrings={formData.dates}
                                        onDatesStringSelect={(dateStrs) => handleDatesSelect(dateStrs)}
                                        showInline={true}
                                        showTodayButton={false}
                                        selectionMode="multiple"
                                        availableDates={availableDates}
                                        onMonthChange={(y, m) => onChangeCalendarMonth(y, m)}
                                        disabled={formData.sessionLength === undefined || formData.locationId === ''}
                                        className="border border-border rounded-lg p-4"
                                    />
                                </View>

                                {(formData.sessionLength === undefined && formData.locationId === '') && (
                                    <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                        Please add session length and location first
                                    </Text>
                                )}

                                {formData.dates.length > 0 && artist && formData.locationId !== '' && (
                                    <View className="gap-4">
                                        <View className="gap-2">
                                            <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                                {formData.dates.length === 1
                                                    ? `Selected date - ${formatDbDate(formData.dates[0], 'MMM DD, YYYY')}`
                                                    : `${formData.dates.length} dates selected`
                                                }
                                            </Text>
                                        </View>
                                        <View className="gap-4">
                                            {formData.dates.map((date) => {
                                                return (
                                                    <View key={date} className="gap-2">
                                                        <Text variant="h5" className="text-foreground">
                                                            {formatDbDate(date, 'MMM DD, YYYY')}
                                                        </Text>
                                                        <StartTimes 
                                                            date={date} 
                                                            sessionLength={formData.sessionLength || 0}
                                                            artist={artist} 
                                                            locationId={formData.locationId}
                                                            selectedTime={formData.startTimes[date]}
                                                            onTimeSelect={handleTimeSelect}
                                                        />
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}

                                <View className="flex-row items-center justify-between gap-3">
                                    <View className="flex-1 gap-2">
                                        <Text variant="h5">Deposit Amount</Text>
                                        <Input inputMode="numeric" value={formData.depositAmount} onChangeText={(text) => setFormData({ ...formData, depositAmount: text })} leftIcon={DollarSignIcon} />
                                    </View>
                                    <View className="flex-1 gap-2">
                                        <Text variant="h5">Session rate</Text>
                                        <Input inputMode="numeric" value={formData.sessionRate} onChangeText={(text) => setFormData({ ...formData, sessionRate: text })} leftIcon={DollarSignIcon} />
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
                        <Button variant="outline" onPress={handleCompleteBooking} className="w-full" disabled={submitting}>
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
