import { useState, useEffect, useCallback } from "react";
import { View, Pressable, Image, ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useFocusEffect } from "expo-router";
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
import { convertTimeToISOString, convertTimeToHHMMString, truncateFileName, formatDbDate, parseYmdToLocalDate, convertHhMmToDisplay } from "@/lib/utils";
import { Collapse } from "@/components/lib/collapse";

import X_IMAGE from "@/assets/images/icons/x.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";
import { TimeDurationPicker } from "@/components/lib/time-duration-picker";
import { Icon } from "@/components/ui/icon";
import { FileText, FileSearch } from "lucide-react-native";
import { getQuickAppointmentById, updateProjectSession } from '@/lib/services/booking-service';
import { updateClient } from '@/lib/services/clients-service';
import { WaiverSign } from "@/components/lib/waiver-sign";
import { StartTimes } from "@/components/pages/booking/start-times";
import { Artist } from "@/lib/redux/types";

interface QuickAppointmentData {
    clientId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    date: string;
    startTime: string;
    locationId: string;
    sessionLength: string;
    notes: string;
    waiverSigned: boolean;
    waiverUrl?: string;
}

export default function QuickAppointmentEditPage() {
    const { toast } = useToast();
    const { artist } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { id } = useLocalSearchParams<{ id: string }>();
    const [waiverSignVisible, setWaiverSignVisible] = useState(false);

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
        clientId: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        date: '',
        startTime: '09:00',
        locationId: '',
        sessionLength: '',
        notes: '',
        waiverSigned: false,
        waiverUrl: ''
    });

    const loadAppointment = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await getQuickAppointmentById(id);
            if (res.success && res.data) {
                console.log(res.data)
                setFormData({
                    clientId: res.data.client.id || '',
                    fullName: res.data.client.full_name || '',
                    email: res.data.client.email || '',
                    phoneNumber: res.data.client.phone_number || '',
                    locationId: res.data.session.location_id || '',
                    date: res.data.session.date || '',
                    startTime: res.data.session.start_time || '09:00',
                    sessionLength: res.data.session.duration ? String(res.data.session.duration) : '',
                    notes: res.data.session.notes || '',
                    waiverSigned: res.data.project.waiver_signed,
                    waiverUrl: res.data.project.waiver_url,
                });
            }
        } catch (e) {
            toast({ variant: 'error', title: 'Failed to load appointment', duration: 2500 });
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadAppointment();
    }, [loadAppointment]);

    useFocusEffect(
        useCallback(() => {
            loadAppointment();
        }, [loadAppointment])
    );

    const handleBack = () => {
        router.back();
    };

    const handleSave = async () => {
        if (!artist?.id) {
            toast({ variant: 'error', title: 'Not authenticated', duration: 2500 });
            return;
        }
        if (!formData.clientId) {
            toast({ variant: 'error', title: 'Missing client ID', duration: 2500 });
            return;
        }
        if (!id) {
            toast({ variant: 'error', title: 'Missing appointment ID', duration: 2500 });
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

        setSaving(true);
        try {
            const success = await updateClient(artist.id, formData.clientId, {
                name: formData.fullName.trim(),
                email: formData.email.trim(),
                phone_number: formData.phoneNumber?.trim() || '',
            });
            
            if (!success) {
                toast({ variant: 'error', title: 'Failed to update client', duration: 2500 });
                return;
            }

            const result = await updateProjectSession({
                artist: artist as Artist,
                sessionId: id,
                date: parseYmdToLocalDate(formData.date) as Date,
                startTimeDisplay: convertHhMmToDisplay(formData.startTime),
                sessionLengthMinutes: parseInt(formData.sessionLength),
                locationId: formData.locationId,
            });

            if (!result.success) {
                toast({ variant: 'error', title: result.error || 'Failed to update appointment', duration: 2500 });
                return;
            }

            toast({ variant: 'success', title: 'Appointment updated', duration: 2500 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        } catch (e) {
            toast({ variant: 'error', title: 'Failed to update appointment', duration: 2500 });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
    };

    const openWaiverSign = (waiverUrl: string | undefined, signedUrl: string | undefined) => {

        if (!waiverUrl && !signedUrl) return;
        setWaiverSignVisible(true);
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

    const handleTimeSelect = (date: string, time: string) => {
        setFormData({ ...formData, startTime: time });
    }

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                <SafeAreaView className='flex-1 bg-background items-center justify-center'>
                    <ActivityIndicator size="large" color="#fff" />
                </SafeAreaView>
            </>
        );
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
                                    <Text variant="h6" className="text-center uppercase">Edit Quick</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Add Appointment</Text>
                                </View>

                                {/* Form Fields */}
                                <View className="gap-6">
                                    {/* Full Name */}
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

                                    <View className="items-start gap-2">
                                        <Collapse title="Session length" textClassName="text-xl">
                                            <View className="gap-2 w-full">
                                                <TimeDurationPicker
                                                    selectedDuration={formData.sessionLength ? parseInt(formData.sessionLength) : undefined}
                                                    onDurationSelect={(duration) => setFormData({ ...formData, sessionLength: String(duration) })}
                                                    minuteInterval={15}
                                                    minDuration={15}
                                                    maxDuration={525}
                                                    modalTitle="Select Session Duration"
                                                />
                                            </View>
                                        </Collapse>
                                    </View>

                                    <View className="gap-4">
                                        <View className="gap-2">
                                            <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                                Selected date - {formatDbDate(formData.date, 'MMM DD, YYYY')}
                                            </Text>
                                        </View>
                                        <View className="gap-4">
                                            <View className="gap-2">
                                                <Text variant="h5" className="text-foreground">
                                                    {formatDbDate(formData.date, 'MMM DD, YYYY')}
                                                </Text>
                                                {formData.sessionLength && formData.locationId && formData.date ? (
                                                    <StartTimes
                                                        date={formData.date}
                                                        sessionLength={parseInt(formData.sessionLength)}
                                                        artist={artist as Artist}
                                                        locationId={formData.locationId}
                                                        selectedTime={formData.startTime}
                                                        onTimeSelect={handleTimeSelect}
                                                    />
                                                ) : null}
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

                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Button onPress={handleCancel} variant="outline" disabled={saving}>
                                            <Text variant='h5'>Cancel</Text>
                                        </Button>
                                    </View>

                                    <View className="flex-1">
                                        <Button onPress={handleSave} variant="outline" disabled={saving}>
                                            <Text variant='h5'>{saving ? 'Saving...' : 'Save'}</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper >
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
