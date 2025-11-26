import { useState } from "react";
import { View, Pressable, Image } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from "expo-router";
import { router } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TimePicker } from '@/components/lib/time-picker';
import { useToast } from "@/lib/contexts/toast-context";
import { useAuth } from '@/lib/contexts/auth-context';
import { convertTimeToISOString, convertTimeToHHMMString, parseYmdFromDb } from "@/lib/utils";
import { Collapse } from "@/components/lib/collapse";

import X_IMAGE from "@/assets/images/icons/x.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";
import { TimeDurationPicker } from "@/components/lib/time-duration-picker";
import { Icon } from "@/components/ui/icon";
import { FileText, FileSearch } from "lucide-react-native";
import { createClientWithAuth } from '@/lib/services/clients-service';
import { createQuickAppointment } from '@/lib/services/calendar-service';
import { createManualBooking } from "@/lib/services/booking-service";

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

export default function QuickAppointmentAddPage() {
    const { toast } = useToast();
    const { artist } = useAuth();
    const [loading, setLoading] = useState(false);
    const { date } = useLocalSearchParams<{ date?: string }>();

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
    });

    const handleBack = () => {
        router.back();
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
        if (!formData.startTime?.trim()) {
            toast({ variant: 'error', title: 'Start time is required', duration: 2500 });
            return;
        }
        if (!formData.sessionLength?.trim()) {
            toast({ variant: 'error', title: 'Session length is required', duration: 2500 });
            return;
        }

        const dateStr = (() => {
            const pad = (n: number) => String(n).padStart(2, '0');
            if (date) {
                try {
                    const d = parseYmdFromDb(String(date));
                    if (!isNaN(d.getTime())) {
                        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                    }
                } catch { /* noop */ }
                // Fallback: if string starts with YYYY-MM-DD, take that portion
                const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date));
                if (m) return `${m[1]}-${m[2]}-${m[3]}`;
            }
            const now = new Date();
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        })();

        const result = await createQuickAppointment({
            artistId: artist.id,
            date: dateStr,
            fullName: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            startTime: formData.startTime,
            sessionLength: parseInt(formData.sessionLength),
            notes: formData.notes,
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
        const locationId = String((mainLocation?.id || fallbackLocation?.id || ''));

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
            date: new Date(dateStr),
            startTimeDisplay: formData.startTime,
            depositAmount: 0,
            sessionRate: 0,
            notes: formData.notes || '',
            waiverSigned: formData.waiverSigned,
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

        toast({ variant: 'success', title: 'Quick appointment created', duration: 2500 });
        router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
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
                        >
                            <View className="gap-6 pb-6">
                                <View className="items-center justify-center pb-[22px]">
                                    <Image
                                        source={APPOINTMENT_IMAGE}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Add Quick</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Appointment</Text>
                                    <Text className="text-center mt-2 text-text-secondary max-w-[300px]">Create a same-day appointment without sending a quote or emails</Text>
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
                                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                                className="w-full"
                                            />
                                            <Text className="text-text-secondary text-sm">Aftercare link will be automatically emailed</Text>
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
                                    </View>

                                    <View className="gap-6">
                                        <View className="items-start gap-2">
                                            <Collapse title="Start Time" textClassName="text-xl">
                                                <View className="gap-2 w-full">
                                                    <TimePicker
                                                        minuteInterval={15}
                                                        className="w-full"
                                                        selectedTime={formData.startTime ? convertTimeToISOString(formData.startTime) : undefined}
                                                        onTimeSelect={(time) => setFormData({ ...formData, startTime: convertTimeToHHMMString(time) })}
                                                    />
                                                </View>
                                            </Collapse>
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
                                        className="flex-row gap-2 bg-background-secondary p-4 rounded-lg border border-border"
                                    >
                                        <View className="h-12 w-12 rounded-full bg-foreground items-center justify-center">
                                            <Icon as={FileText} strokeWidth={2} size={24} className="text-background" />
                                        </View>
                                        <View className="gap-2 flex-1">
                                            <View style={{ width: formData.waiverSigned ? 50 : 70 }} className={`border items-center justify-center rounded-full px-1 ${formData.waiverSigned ? 'border-green bg-green/10' : 'border-destructive bg-destructive/10'}`}>
                                                <Text className={`text-xs items-center justify-center ${formData.waiverSigned ? 'text-green' : 'text-destructive'}`} style={{ fontSize: 10 }}>{formData.waiverSigned ? 'Signed' : 'Not Signed'}</Text>
                                            </View>
                                            <Text variant="small">{waiverFileName || 'No waiver uploaded'}</Text>
                                            <View className="flex-row items-center gap-1">
                                                <Text variant="small">{formData.waiverSigned ? 'Preview' : 'Preview and Sign'}</Text>
                                                <Icon as={FileSearch} strokeWidth={1} size={16} />
                                            </View>
                                        </View>
                                    </Pressable>
                                </View>

                                <Button onPress={handleSave} size="lg" disabled={loading}>
                                    <Text variant='h5'>{loading ? 'Saving...' : 'Add To Calendar'}</Text>
                                </Button>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper >
            </SafeAreaView >
        </>
    );
}
