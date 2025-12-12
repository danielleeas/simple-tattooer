import { useState, useMemo } from "react";
import { View, Pressable, Image, Linking } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from "expo-router";
import { router } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import CustomModal from '@/components/lib/custom-modal';
import Header from "@/components/lib/Header";
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TimePicker } from '@/components/lib/time-picker';
import { useToast } from "@/lib/contexts/toast-context";
import { useAuth } from '@/lib/contexts/auth-context';
import { convertTimeToISOString, convertTimeToHHMMString, parseYmdFromDb, truncateFileName, validatePhoneNumber, formatDbDate } from "@/lib/utils";
import { Collapse } from "@/components/lib/collapse";
import { checkArtistExists } from "@/lib/services/auth-service";
import { createClientWithAuth, checkClientExists, checkClientExistsByPhone } from '@/lib/services/clients-service';
import { createQuickAppointment, checkEventOverlap } from '@/lib/services/calendar-service';
import { createManualBooking } from "@/lib/services/booking-service";
import { WaiverSign } from "@/components/lib/waiver-sign";

import X_IMAGE from "@/assets/images/icons/x.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";
import { TimeDurationPicker } from "@/components/lib/time-duration-picker";
import { Icon } from "@/components/ui/icon";
import { FileText, FileSearch } from "lucide-react-native";
import { Locations } from "@/lib/redux/types";

type QuickAppointmentData = {
    fullName: string;
    email: string;
    phoneNumber?: string;
    date: string;
    startTime: string;
    sessionLength: string;
    notes: string;
    waiverSigned: boolean;
    waiverUrl?: string;
};

const normalizeDateParamToYmd = (dateParam?: string): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    if (dateParam) {
        try {
            const d = parseYmdFromDb(String(dateParam));
            if (!isNaN(d.getTime())) {
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }
        } catch {
            // noop
        }
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateParam));
        if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    }
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// Convert HH:MM format to display format (e.g., "09:00" -> "9:00 AM")
const convertHhMmToDisplay = (hhmm: string): string => {
    if (!hhmm) return '';
    const [hStr, mStr] = hhmm.split(':');
    const h24 = Number(hStr);
    const m = Number(mStr);
    if (Number.isNaN(h24) || Number.isNaN(m)) return hhmm;
    const period = h24 < 12 ? 'AM' : 'PM';
    const h12 = ((h24 + 11) % 12) + 1;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

// Calculate end time from start time and duration in minutes
const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    if (!startTime) return '';
    const [hStr, mStr] = startTime.split(':');
    const hours = Number(hStr);
    const minutes = Number(mStr);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';

    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

export default function QuickAppointmentAddPage() {
    const { toast } = useToast();
    const { artist } = useAuth();
    const [loading, setLoading] = useState(false);
    const { date } = useLocalSearchParams<{ date?: string }>();

    const [waiverSignVisible, setWaiverSignVisible] = useState(false);
    const [emailError, setEmailError] = useState<string>('');
    const [showExistingClientModal, setShowExistingClientModal] = useState(false);
    const [existingClientData, setExistingClientData] = useState<any>(null);

    // Email validation function
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const dateLocation = useMemo<Locations | undefined>(() => {
        const locations = Array.isArray(artist?.locations) ? artist.locations : [];
        if (!locations.length) return undefined;

        const ymd = normalizeDateParamToYmd(date || undefined);
        const target = new Date(`${ymd}T12:00:00`);

        // First, try to find a temporary location (with start_at/end_at) that matches the date
        const inRangeLocation = locations.find((loc) => {
            // Skip if no date range defined
            if (!loc.start_at && !loc.end_at) return false;

            // Skip main studio (main studio should not have date ranges)
            if (loc.is_main_studio) return false;

            const start = loc.start_at ? new Date(String(loc.start_at).replace(' ', 'T')) : undefined;
            const end = loc.end_at ? new Date(String(loc.end_at).replace(' ', 'T')) : undefined;

            if (start && isNaN(start.getTime())) return false;
            if (end && isNaN(end.getTime())) return false;

            if (start && end) {
                return target >= start && target <= end;
            }
            if (start && !end) {
                return target >= start;
            }
            if (!start && end) {
                return target <= end;
            }
            return false;
        });

        if (inRangeLocation) return inRangeLocation;

        // Fallback to main studio
        const mainLocation = locations.find((l) => l.is_main_studio);
        return mainLocation || locations[0];
    }, [artist?.locations, date]);

    console.log('dateLocation', dateLocation);

    // Check if form is valid
    const isFormValid = () => {
        return (
            formData.fullName.trim() !== '' &&
            formData.email.trim() !== '' &&
            validateEmail(formData.email) &&
            formData.startTime.trim() !== '' &&
            formData.sessionLength.trim() !== ''
        );
    };

    const getFileNameFromUrl = (inputUrl: string): string => {
        if (!inputUrl) return '';
        const withoutQuery = inputUrl.split('?')[0];
        const rawName = withoutQuery.split('/').pop() || '';
        try {
            return decodeURIComponent(rawName);
        } catch {
            return rawName;
        }
    };

    const waiverUrl = artist?.rule?.waiver_text || '';
    const waiverFileName = waiverUrl ? getFileNameFromUrl(waiverUrl) : '';

    const [formData, setFormData] = useState<QuickAppointmentData>({
        fullName: '',
        email: '',
        phoneNumber: '',
        date: '',
        startTime: '09:00',
        sessionLength: '',
        notes: '',
        waiverSigned: false,
        waiverUrl: ''
    });

    const handleBack = () => {
        router.back();
    };

    const handleEmailChange = (text: string) => {
        setFormData({ ...formData, email: text });

        // Validate email format
        if (text.trim() && !validateEmail(text)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    const handleContinueWithExistingClient = async () => {
        if (existingClientData) {
            setShowExistingClientModal(false);
            // Continue with the existing client data
            setFormData({
                ...formData,
                fullName: existingClientData.full_name,
                email: existingClientData.email,
                phoneNumber: existingClientData.phone_number,
            });
            await handleCreateQuickAppointment(existingClientData.full_name, existingClientData.email, existingClientData.phone_number);

            toast({ variant: 'success', title: 'Quick appointment created', duration: 2500 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        }
    };

    const handleCancelExistingClient = () => {
        setShowExistingClientModal(false);
        setExistingClientData(null);
    };

    const handleCreateQuickAppointment = async (fullName: string, email: string, phoneNumber: string) => {
        try {
            setLoading(true);
            if (!artist?.id) {
                toast({ variant: 'error', title: 'Not authenticated', duration: 2500 });
                return;
            }
            const dateStr = normalizeDateParamToYmd(date || undefined);

            // Calculate end time from start time and session length
            const sessionLengthMinutes = parseInt(formData.sessionLength);
            const endTime = calculateEndTime(formData.startTime, sessionLengthMinutes);

            const break_time = (artist?.flow as any)?.break_time || 0;
            const overlapCheck = await checkEventOverlap({
                artistId: artist.id,
                date: dateStr,
                startTime: formData.startTime,
                endTime: endTime,
                break_time: break_time,
                source: 'quick_appointment',
            });

            if (!overlapCheck.success) {
                toast({ variant: 'error', title: overlapCheck.error || 'Failed to check for conflicts', duration: 3000 });
                setLoading(false);
                return;
            }

            if (overlapCheck.hasOverlap) {
                toast({
                    variant: 'error',
                    title: 'Time conflict detected',
                    description: `This time overlaps with an existing event: ${overlapCheck.overlappingEvent?.title || 'Unknown'}`,
                    duration: 3000
                });
                setLoading(false);
                return;
            }
            const result = await createQuickAppointment({
                artistId: artist.id,
                date: dateStr,
                fullName: fullName,
                email: email,
                phoneNumber: phoneNumber,
                startTime: formData.startTime,
                sessionLength: parseInt(formData.sessionLength),
                notes: formData.notes,
                waiverSigned: formData.waiverSigned,
                waiverUrl: formData.waiverUrl
            });

            if (!result.success) {
                toast({ variant: 'error', title: result.error || 'Failed to create appointment', duration: 2500 });
                return;
            }

            const created = await createClientWithAuth({
                full_name: formData.fullName.trim(),
                email: formData.email.trim(),
                phone_number: formData.phoneNumber?.trim() || '',
                project_notes: formData.notes ? formData.notes : null,
                artist_id: artist.id,
            });
            if (!created?.success || !created?.client?.id) {
                toast({
                    variant: 'error',
                    title: 'Failed to create client',
                    duration: 3000,
                });
                return;
            }
            const clientId: string = created.client.id as string;

            const locations = Array.isArray(artist?.locations) ? artist.locations : [];
            const mainLocation = locations.find((l: any) => (l as any)?.is_main_studio);
            const fallbackLocation = locations[0];
            const chosenLocation = dateLocation || mainLocation || fallbackLocation;
            const locationId = String((chosenLocation?.id || ''));

            if (!locationId) {
                toast({
                    variant: 'error',
                    title: 'Missing location',
                    duration: 3000,
                });
                return;
            }

            const bookingResult = await createManualBooking({
                artistId: artist.id,
                clientId,
                title: formData.fullName?.trim() || 'Appointment',
                sessionLengthMinutes: parseInt(formData.sessionLength) || 0,
                locationId,
                dates: [dateStr],
                startTimes: { [dateStr]: convertHhMmToDisplay(formData.startTime) },
                depositAmount: 0,
                sessionRate: 0,
                notes: formData.notes || '',
                waiverSigned: formData.waiverSigned,
                waiverUrl: formData.waiverUrl,
                source: 'quick_appointment',
                sourceId: result.id,
            });

            if (!bookingResult.success) {
                toast({
                    variant: 'error',
                    title: 'Failed to create booking',
                    description: result.error || 'Please try again',
                    duration: 3000,
                });
                return;
            }
        } catch (error) {
            toast({ variant: 'error', title: 'Failed to create quick appointment', duration: 2500 });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Basic validations (mirror off-days add flow)
        if (!artist?.id) {
            toast({ variant: 'error', title: 'Not authenticated', duration: 2500 });
            return;
        }
        if (!formData.fullName?.trim()) {
            toast({ variant: 'error', title: 'Full name is required', duration: 2500 });
            return;
        }
        if (!formData.email?.trim()) {
            toast({ variant: 'error', title: 'Email is required', duration: 2500 });
            return;
        }
        if (!validateEmail(formData.email)) {
            toast({ variant: 'error', title: 'Invalid email', description: 'Please enter a valid email address.', duration: 2500 });
            return;
        }
        if (!formData.startTime?.trim()) {
            toast({ variant: 'error', title: 'Start time is required', duration: 2500 });
            return;
        }
        if (!formData.sessionLength?.trim()) {
            toast({ variant: 'error', title: 'Session length is required', duration: 2500 });
            return;
        }

        // Check for overlapping events before creating
        try {
            setLoading(true);

            // Check if an artist exists with the same email
            const artistCheck = await checkArtistExists(formData.email.trim().toLowerCase());
            if (artistCheck.error) {
                toast({
                    variant: 'error',
                    title: 'Error',
                    description: 'Failed to verify email. Please try again.',
                    duration: 2500
                });
                return;
            }
            if (artistCheck.exists) {
                toast({
                    variant: 'error',
                    title: 'Email already exists',
                    description: 'An artist with this email already exists.',
                    duration: 2500
                });
                return;
            }

            // Check if a client exists with the same email
            const clientCheck = await checkClientExists(formData.email.trim());
            if (clientCheck.error) {
                toast({
                    variant: 'error',
                    title: 'Error',
                    description: 'Failed to verify email. Please try again.',
                    duration: 2500
                });
                return;
            }
            if (clientCheck.exists && clientCheck.client) {
                // Show modal to confirm using existing client
                setExistingClientData(clientCheck.client);
                setShowExistingClientModal(true);
                return;
            }

            // Check if a client exists with the same phone number (if phone provided)
            if (formData.phoneNumber?.trim()) {
                const clientPhoneCheck = await checkClientExistsByPhone(formData.phoneNumber.trim());
                if (clientPhoneCheck.error) {
                    toast({
                        variant: 'error',
                        title: 'Error',
                        description: 'Failed to verify phone number. Please try again.',
                        duration: 2500
                    });
                    return;
                }
                if (clientPhoneCheck.exists && clientPhoneCheck.client) {
                    // Show modal to confirm using existing client
                    setExistingClientData(clientPhoneCheck.client);
                    setShowExistingClientModal(true);
                    return;
                }
            }

            await handleCreateQuickAppointment(formData.fullName.trim(), formData.email.trim(), formData.phoneNumber?.trim() || '');

            toast({ variant: 'success', title: 'Quick appointment created', duration: 2500 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        } catch (error) {
            toast({ variant: 'error', title: 'Failed to create appointment', duration: 2500 });
        } finally {
            setLoading(false);
        }
    };

    const handleSignWaiver = async (signedPdfUrl: string) => {
        try {
            // The waiver has already been uploaded in the WaiverSign component
            // We just need to update the form data with the final URL
            setFormData({ ...formData, waiverSigned: true, waiverUrl: signedPdfUrl });
            setWaiverSignVisible(false);
        } catch (error) {
            console.error('Error handling signed waiver:', error);
            toast({
                variant: 'error',
                title: 'Failed to process waiver',
                description: error instanceof Error ? error.message : 'Please try again',
                duration: 3000
            });
        }
    };

    const openWaiverSign = (waiverUrl: string | undefined, signedUrl: string | undefined) => {

        if (!waiverUrl && !signedUrl) return;
        setWaiverSignVisible(true);

    };

    const handleCall = async (phone_number: string) => {
        if (!validatePhoneNumber(phone_number)) {
            toast({
                variant: 'error',
                title: 'Invalid phone number',
            });
            return;
        }
        const url = `tel:${phone_number}`;
        if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url);
        } else {
            toast({
                variant: 'error',
                title: 'Cannot open phone app',
            });
        }
    }

    const handleMessage = async (phone_number: string) => {
        if (!validatePhoneNumber(phone_number)) {
            toast({
                variant: 'error',
                title: 'Invalid phone number',
            });
            return;
        }
        const url = `sms:${phone_number}`;
        if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url);
        } else {
            toast({
                variant: 'error',
                title: 'Cannot open message app',
            });
        }
    }

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
                                <View className="items-center justify-center pb-[22px]">
                                    <Image
                                        source={APPOINTMENT_IMAGE}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Quick Add</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Appointment</Text>
                                    <Text className="text-center mt-2 text-text-secondary max-w-[300px] leading-5">Create a same-day appointment without sending a quote or emails</Text>
                                </View>

                                {/* Form Fields */}
                                <View className="gap-6">
                                    {/* Event Name */}
                                    <View className="gap-2">
                                        <Text variant="h5">Full Name</Text>
                                        <Input
                                            spellCheck={false}
                                            autoComplete="off"
                                            textContentType="none"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            value={formData.fullName}
                                            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                                            className="w-full"
                                        />
                                    </View>

                                    <View className="gap-2">
                                        <Text variant="h5">Email</Text>
                                        <View className="gap-1">
                                            <Input
                                                spellCheck={false}
                                                autoComplete="off"
                                                textContentType="none"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                value={formData.email}
                                                onChangeText={handleEmailChange}
                                                helperText={emailError}
                                                error={!!emailError}
                                                className="w-full"
                                                keyboardType="email-address"
                                            />
                                            {!emailError && <Text className="text-text-secondary text-sm">Aftercare link will be automatically emailed</Text>}
                                        </View>
                                    </View>

                                    <View className="gap-2">
                                        <Text variant="h5">Phone Number</Text>
                                        <Input
                                            spellCheck={false}
                                            autoComplete="off"
                                            textContentType="none"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            value={formData.phoneNumber}
                                            onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                                            className="w-full"
                                        />
                                        {formData.phoneNumber && validatePhoneNumber(formData.phoneNumber) && (
                                            <View className="flex-row items-center gap-4">
                                                <Pressable className="flex-row items-center gap-1" onPress={() => handleCall(formData.phoneNumber || '')}>
                                                    <Image source={require('@/assets/images/icons/phone_thick.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                                                    <Text variant="h5">Call</Text>
                                                </Pressable>
                                                <Pressable className="flex-row items-center gap-1" onPress={() => handleMessage(formData.phoneNumber || '')}>
                                                    <Image source={require('@/assets/images/icons/chat.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                                    <Text variant="h5">Message</Text>
                                                </Pressable>
                                            </View>
                                        )}
                                    </View>

                                    <View className="items-start gap-2">
                                        <Collapse title="Session length" textClassName="text-xl">
                                            <View className="gap-2 w-full">
                                                <TimeDurationPicker
                                                    selectedDuration={formData.sessionLength ? parseInt(formData.sessionLength) : undefined}
                                                    onDurationSelect={(duration) => setFormData({ ...formData, sessionLength: String(duration) })}
                                                    minuteInterval={15}
                                                    minDuration={15}
                                                    maxDuration={240}
                                                    modalTitle="Select Session Duration"
                                                />
                                            </View>
                                        </Collapse>
                                    </View>

                                    <View className="gap-4">
                                        <View className="gap-2">
                                            <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                                Selected date - {formatDbDate(date, 'MMM DD, YYYY')}
                                            </Text>
                                        </View>
                                        <View className="gap-4">
                                            <View key={date} className="gap-2">
                                                <Text variant="h5" className="text-foreground">
                                                    {formatDbDate(date, 'MMM DD, YYYY')}
                                                </Text>
                                                {formData.sessionLength  }
                                            </View>
                                        </View>
                                    </View>
                                    
                                    <View className="gap-2">
                                        <Text variant="h5">Notes</Text>
                                        <Textarea
                                            placeholder="Add project notes & location here"
                                            className="min-h-28"
                                            value={formData.notes}
                                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                                        />
                                    </View>

                                    <View className="gap-1">
                                        <Text variant="h4">Sign Waiver</Text>
                                        <Text className="text-text-secondary">Save now, sign later</Text>
                                    </View>

                                    <Pressable
                                        onPress={() => openWaiverSign(artist?.rule?.waiver_text, formData.waiverUrl)}
                                        className="flex-row gap-2 bg-background-secondary p-4 rounded-lg border border-border"
                                    >
                                        <View className="h-12 w-12 rounded-full bg-foreground items-center justify-center">
                                            <Icon as={FileText} strokeWidth={2} size={24} className="text-background" />
                                        </View>
                                        <View className="gap-2 flex-1">
                                            <View style={{ width: formData.waiverSigned ? 50 : 70 }} className={`border items-center justify-center rounded-full px-1 ${formData.waiverSigned ? 'border-green bg-green/10' : 'border-destructive bg-destructive/10'}`}>
                                                <Text className={`text-xs items-center justify-center ${formData.waiverSigned ? 'text-green' : 'text-destructive'}`} style={{ fontSize: 10 }}>{formData.waiverSigned ? 'Signed' : 'Not Signed'}</Text>
                                            </View>
                                            {formData.waiverSigned ?
                                                (
                                                    <Text variant="small">Signed.pdf</Text>
                                                )
                                                :
                                                (
                                                    <Text variant="small">{waiverFileName ? truncateFileName(waiverFileName) : 'No waiver uploaded'}</Text>
                                                )
                                            }
                                            <View className="flex-row items-center gap-1">
                                                <Text variant="small">{formData.waiverSigned ? 'Preview' : 'Preview and Sign'}</Text>
                                                <Icon as={FileSearch} strokeWidth={2} size={16} />
                                            </View>
                                        </View>
                                    </Pressable>
                                </View>

                                <Button onPress={handleSave} variant="outline" disabled={!isFormValid() || loading}>
                                    <Text variant='h5'>{loading ? 'Saving...' : 'Add To Calendar'}</Text>
                                </Button>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper >

                {/* Existing Client Confirmation Modal */}
                <CustomModal
                    visible={showExistingClientModal}
                    onClose={handleCancelExistingClient}
                    variant="center"
                    showCloseButton={false}
                    closeOnBackdrop={false}
                >
                    <View className="px-6 py-6 bg-background-secondary rounded-lg">
                        <View className="items-center gap-4 mb-6">
                            <Text variant="h4" className="text-center">Client Already Exists</Text>
                            <Text className="text-center text-text-secondary">
                                A client with this {existingClientData?.email === formData.email ? 'email' : 'phone number'} already exists.
                            </Text>
                            <View className="mt-2 w-full bg-background rounded-lg p-4">
                                <Text variant="h6" className="mb-2">Existing Client:</Text>
                                <Text className="text-text-secondary">Name: {existingClientData?.full_name}</Text>
                                <Text className="text-text-secondary">Email: {existingClientData?.email}</Text>
                                <Text className="text-text-secondary">Phone: {existingClientData?.phone_number}</Text>
                            </View>
                            <Text className="text-center text-text-secondary mt-2">
                                You will continue with this existing client.
                            </Text>
                        </View>
                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <Button variant="outline" onPress={handleCancelExistingClient}>
                                    <Text variant="h5">Cancel</Text>
                                </Button>
                            </View>
                            <View className="flex-1">
                                <Button variant="outline" onPress={handleContinueWithExistingClient}>
                                    <Text variant="h5">Continue</Text>
                                </Button>
                            </View>
                        </View>
                    </View>
                </CustomModal>

                <WaiverSign
                    visible={waiverSignVisible}
                    onClose={() => setWaiverSignVisible(false)}
                    waiverUrl={formData.waiverUrl ? formData.waiverUrl : waiverUrl}
                    onSign={handleSignWaiver}
                    artistId={artist?.id}
                />
            </SafeAreaView >
        </>
    );
}
