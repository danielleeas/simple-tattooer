import { useCallback, useEffect, useState } from "react";
import { View, Image, type ImageStyle, ScrollView, Modal, ActivityIndicator, Pressable, Linking } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";

import { useToast } from "@/lib/contexts/toast-context";
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";
import PENCIL_SIMPLE from "@/assets/images/icons/pencil_simple.png";
import DELETE_IMAGE from "@/assets/images/icons/delete.png";
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { formatTime, validatePhoneNumber } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { getQuickAppointmentById, deleteQuickAppointment } from "@/lib/services/booking-service";

const BUTTON_ICON_STYLE: ImageStyle = {
    height: 24,
    width: 24,
}

interface QuickAppointmentData {
    clientId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    date: string;
    startTime: string;
    sessionLength: number;
    notes: string;
}

export default function QuickAppointmentDetailPage() {
    const { toast } = useToast();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const { id } = useLocalSearchParams<{ id: string }>();
    const [appointment, setAppointment] = useState<QuickAppointmentData | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadAppointment = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getQuickAppointmentById(id);
            if (res.success && res.data) {
                setAppointment({
                    clientId: res.data.client.id,
                    fullName: res.data.client.full_name,
                    email: res.data.client.email,
                    phoneNumber: res.data.client.phone_number,
                    date: res.data.session.date,
                    startTime: res.data.session.start_time,
                    sessionLength: res.data.session.duration,
                    notes: res.data.session.notes,
                });
            } else {
                setAppointment(null);
            }
        } catch (e) {
            setAppointment(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadAppointment();
        }
    }, [id]);

    const handleBack = () => {
        router.back();
    };

    const handleEdit = () => {
        router.push({
            pathname: '/artist/calendar/quick-appointment/edit',
            params: { id }
        });
    }

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            const res = await deleteQuickAppointment(id);
            if (!res.success) {
                toast({ variant: 'error', title: res.error || 'Failed to delete appointment', duration: 3000 });
                return;
            }
            setIsDeleteModalOpen(false);
            toast({ variant: 'success', title: 'Appointment deleted!', duration: 3000 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        } catch (e) {
            toast({ variant: 'error', title: 'Failed to delete appointment', duration: 3000 });
        } finally {
            setDeleting(false);
        }
    };

    const formatSessionLength = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h`;
        return `${mins}m`;
    };

    const openClientProfile = (clientId: string) => {
        router.push({
            pathname: '/artist/clients/[id]',
            params: { id: clientId }
        });
    }

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
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background p-4 pt-2 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6">
                                    <View className="items-center justify-center pb-4">
                                        <Image
                                            source={APPOINTMENT_IMAGE}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Quick Add</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Appointment Detail</Text>
                                    </View>
                                    {loading && (
                                        <View className="flex-1 items-center justify-center">
                                            <ActivityIndicator size="large" color="#fff" />
                                        </View>
                                    )}

                                    {appointment && !loading && (
                                        <>
                                            <Pressable className="gap-1" onPress={() => openClientProfile(appointment.clientId)}>
                                                <Text className="text-text-secondary">Full Name</Text>
                                                <Text variant='h5'>{appointment.fullName}</Text>
                                            </Pressable>

                                            <View className="gap-1">
                                                <Text className="text-text-secondary">Email</Text>
                                                <Text variant='h5'>{appointment.email}</Text>
                                            </View>

                                            <View className="gap-1">
                                                <Text className="text-text-secondary">Phone Number</Text>
                                                <Text variant='h5'>{appointment.phoneNumber}</Text>
                                                {appointment.phoneNumber && validatePhoneNumber(appointment.phoneNumber) && (
                                                    <View className="flex-row items-center gap-4">
                                                        <Pressable className="flex-row items-center gap-1" onPress={() => handleCall(appointment.phoneNumber || '')}>
                                                            <Image source={require('@/assets/images/icons/phone_thick.png')} style={{ width: 13, height: 13 }} resizeMode="contain" />
                                                            <Text variant="h6">Call</Text>
                                                        </Pressable>
                                                        <Pressable className="flex-row items-center gap-1" onPress={() => handleMessage(appointment.phoneNumber || '')}>
                                                            <Image source={require('@/assets/images/icons/chat.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                                                            <Text variant="h6">Message</Text>
                                                        </Pressable>
                                                    </View>
                                                )}
                                            </View>

                                            <View className="gap-1">
                                                <Text className="text-text-secondary">Label</Text>
                                                <View className="flex-row gap-3">
                                                    <View className="w-4 h-4 bg-gray-600 rounded-full mt-1" />
                                                    <Text variant='h5'>Quick Appointment</Text>
                                                </View>
                                            </View>

                                            <View className="gap-1">
                                                <Text className="text-text-secondary">Date</Text>
                                                <Text variant='h5'>{appointment.date}</Text>
                                            </View>

                                            <View className="gap-1">
                                                <Text className="text-text-secondary">Start Time</Text>
                                                <Text variant='h5'>{formatTime(appointment.startTime)}</Text>
                                            </View>

                                            <View className="gap-3">
                                                <Text className="text-text-secondary">Session Length</Text>
                                                <Text variant='h5'>{formatSessionLength(appointment.sessionLength)}</Text>
                                            </View>

                                            <View className="gap-3">
                                                <Text className="text-text-secondary">Notes</Text>
                                                <Textarea
                                                    readOnly
                                                    value={appointment.notes || ''}
                                                    className="min-h-28"
                                                />
                                            </View>
                                        </>
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                        <View className="flex-row gap-3">
                            <Button onPress={() => setIsDeleteModalOpen(true)} variant="outline" className="flex-1">
                                <Text variant='h5'>Delete</Text>
                                <Image source={DELETE_IMAGE} style={BUTTON_ICON_STYLE} />
                            </Button>
                            <Button onPress={handleEdit} variant="outline" className="flex-1">
                                <Text variant='h5'>Edit</Text>
                                <Image source={PENCIL_SIMPLE} style={BUTTON_ICON_STYLE} />
                            </Button>
                        </View>
                    </View>

                    <Modal
                        visible={isDeleteModalOpen}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setIsDeleteModalOpen(false)}
                    >
                        <View className="flex-1 bg-black/50 justify-end items-center">
                            <View className="w-full bg-background-secondary rounded-t-3xl p-4 pt-6 gap-6">
                                <View style={{ gap: 8, alignItems: 'center' }}>
                                    <Image source={require('@/assets/images/icons/warning_circle.png')} style={{ width: 80, height: 80 }} />
                                    <Text variant="h3">Delete Appointment</Text>
                                    <Text className="text-text-secondary text-center text-sm leading-5">Are you sure? This action can't be undone.</Text>
                                </View>
                                <View style={{ gap: 8, flexDirection: 'row' }}>
                                    <View style={{ flex: 1 }}>
                                        <Button onPress={() => setIsDeleteModalOpen(false)} disabled={deleting} variant="outline" size='lg' className='items-center justify-center'>
                                            <Text>Cancel</Text>
                                        </Button>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Button variant="outline" onPress={handleDeleteConfirm} size='lg' disabled={deleting} className='items-center justify-center'>
                                            <Text>{deleting ? 'Deleting...' : 'Delete'}</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
