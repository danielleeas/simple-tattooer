import { useMemo, useState } from "react";
import { View, Image } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from "expo-router";

import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { TimeDurationPicker } from '@/components/lib/time-duration-picker';
import { Textarea } from "@/components/ui/textarea";
import { DollarSignIcon } from "lucide-react-native";
import { Locations as ArtistLocation } from "@/lib/redux/types";
import { Collapse } from "@/components/lib/collapse";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import { Input } from "@/components/ui/input";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { useAuth, useToast } from "@/lib/contexts";
import { DatePicker } from "@/components/lib/date-picker";
import { createProjectRequest } from "@/lib/services/booking-service";
import { createClientWithAuth } from "@/lib/services/clients-service";
import { parseYmdFromDb } from "@/lib/utils";

interface FormDataProps {
    title: string;
    startDate: string | null;
    endDate: string | null;
    locationId: string;
    sessionCount: string;
    sessionLength: number | undefined;
    depositAmount: string;
    sessionRate: string;
    notes: string;
}

export default function AutoBookingQuote() {
    const { toast } = useToast();
    const { artist } = useAuth();
    const { clientId, full_name, email, phone_number, project_notes } = useLocalSearchParams();
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<FormDataProps>({
        title: '',
        startDate: null,
        endDate: null,
        locationId: '',
        sessionCount: '',
        sessionLength: undefined,
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

    const handleHome = () => {
        router.dismissAll();
    };

    const handleMenu = () => {
        router.push('/artist/menu');
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
            setFormData(prev => ({ ...prev, startDate: null, endDate: null }));
            return;
        }
        const sorted = [...dates].sort();
        const start = sorted[0];
        const end = sorted[sorted.length - 1];
        setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
    };

    const handleCompleteBooking = async () => {
        try {
            setSubmitting(true);
            if (!artist?.id) {
                toast({ variant: 'error', title: 'Artist information not found' });
                return;
            }

            if (!formData.title.trim()) {
                toast({ variant: 'error', title: 'Please enter a project title' });
                return;
            }

            if (!formData.startDate || !formData.endDate) {
                toast({ variant: 'error', title: 'Please select a date range' });
                return;
            }

            if (!formData.locationId) {
                toast({ variant: 'error', title: 'Please select a location' });
                return;
            }

            if (!formData.sessionCount || parseInt(formData.sessionCount) <= 0) {
                toast({ variant: 'error', title: 'Please enter a valid session count' });
                return;
            }

            if (!formData.sessionLength || formData.sessionLength <= 0) {
                toast({ variant: 'error', title: 'Please select a session length' });
                return;
            }

            if (!formData.sessionRate || parseInt(formData.sessionRate) <= 0) {
                toast({ variant: 'error', title: 'Please enter a valid session rate' });
                return;
            }

            if (!formData.depositAmount || parseInt(formData.depositAmount) < 0) {
                toast({ variant: 'error', title: 'Please enter a valid deposit amount' });
                return;
            }

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

            // Create project request using booking service
            const result = await createProjectRequest({
                artist: artist,
                clientId: resolvedClientId,
                title: formData.title.trim(),
                dateRangeStart: formData.startDate!,
                dateRangeEnd: formData.endDate!,
                locationId: formData.locationId,
                sessionCount: parseInt(formData.sessionCount),
                sessionLength: formData.sessionLength!,
                sessionRate: parseInt(formData.sessionRate),
                depositAmount: parseInt(formData.depositAmount),
                notes: formData.notes.trim() || undefined,
                source: 'manual',
                sourceId: null,
            });

            if (!result.success) {
                toast({
                    variant: 'error',
                    title: 'Error',
                    description: result.error || 'Failed to create booking',
                    duration: 3000,
                });
                return;
            }

            toast({
                variant: 'success',
                title: 'Booking Created!',
                description: 'Waiting for client response to pay deposit',
                duration: 3000,
            });

            // Optionally navigate back or to a success page
            router.push('/');
        } catch (error) {
            console.error('Unexpected error creating project request:', error);
            toast({
                variant: 'error',
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
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
                <View className="flex-1 bg-background p-4 pt-2 gap-6">
                    <View className="flex-1">
                        <KeyboardAwareScrollView
                            bottomOffset={50}
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="gap-6 pb-6">
                                <View className="items-center justify-center pb-[22px] h-[180px]">
                                    <Image
                                        source={require('@/assets/images/icons/appointment.png')}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Create</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Quote</Text>
                                    <Text className="text-center mt-2 text-text-secondary">Set the parameters</Text>
                                    <Text className="text-center text-text-secondary leading-none">for this project.</Text>
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Project Title</Text>
                                    <Input
                                        value={formData.title}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                                    />
                                </View>

                                <View className="items-start gap-2">
                                    <Collapse
                                        title="Date Range"
                                        textClassName="text-xl"
                                        description="Choose the date range this project should be booked within"
                                    >
                                        <View className="flex-row items-center w-full gap-2">
                                            <DatePicker
                                                selectedDatesStrings={buildRangeDates(formData.startDate, formData.endDate)}
                                                onDatesStringSelect={handleDatesStringSelect}
                                                showInline={true}
                                                showTodayButton={false}
                                                selectionMode="range"
                                                className="border border-border rounded-sm p-2"
                                            />
                                        </View>
                                    </Collapse>
                                </View>

                                <View className="items-start gap-2">
                                    <Collapse title="Location" textClassName="text-xl">
                                        <DropdownPicker
                                            options={locationOptions}
                                            value={formData.locationId}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}
                                            placeholder="Select location"
                                            modalTitle="Select Location"
                                        />
                                    </Collapse>
                                </View>

                                <View className="flex-row items-center gap-2">
                                    <View className="flex-1 gap-2">
                                        <Text variant="h5" className="w-[200px]">How Many Sessions Will This Take?</Text>
                                    </View>
                                    <View className="w-20">
                                        <Input
                                            keyboardType="numeric"
                                            value={formData.sessionCount}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, sessionCount: text }))}
                                        />
                                    </View>
                                </View>

                                <View className="items-start gap-2">
                                    <Collapse title="How Long Is Each Session?" textClassName="text-xl">
                                        <TimeDurationPicker
                                            selectedDuration={formData.sessionLength}
                                            onDurationSelect={(duration) => setFormData(prev => ({ ...prev, sessionLength: duration }))}
                                            minuteInterval={15}
                                            minDuration={15}
                                            maxDuration={525}
                                            modalTitle="Select Session Duration"
                                        />
                                    </Collapse>
                                </View>

                                <View className="flex-row items-center justify-between gap-3">
                                    <View className="flex-1 gap-2">
                                        <Text variant="h5">Deposit Amount</Text>
                                        <Input
                                            keyboardType="numeric"
                                            value={formData.depositAmount}
                                            leftIcon={DollarSignIcon}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, depositAmount: text }))} />
                                    </View>
                                    <View className="flex-1 gap-2">
                                        <Text variant="h5">Session rate</Text>
                                        <Input
                                            keyboardType="numeric"
                                            value={formData.sessionRate}
                                            leftIcon={DollarSignIcon}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, sessionRate: text }))} />
                                    </View>
                                </View>

                                <View className="gap-2">
                                    <Textarea
                                        spellCheck={false}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="off"
                                        placeholder="Project Notes"
                                        className="min-h-28"
                                        value={formData.notes}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                                    />
                                    <Text variant="small" className="font-thin leading-5 text-text-secondary">These  notes  will  be  sent  to  the  client</Text>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>

                    <View className="gap-4 items-center justify-center">
                        <Button variant="outline" onPress={handleCompleteBooking} className="w-full" disabled={submitting}>
                            <Text variant='h5'>{submitting ? 'Sending...' : 'Send Quote & Deposit'}</Text>
                        </Button>
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
}
