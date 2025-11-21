import Header from "@/components/lib/Header";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { getTempChangeById, TempChangeRecord, deleteTempChange } from "@/lib/services/calendar-service";
import { formatDate, formatTime } from "@/lib/utils";

import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { ScrollView, View, Image, ActivityIndicator, type ImageStyle, Modal } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/contexts/toast-context";
import { Textarea } from "@/components/ui/textarea";

import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";
import PENCIL_SIMPLE from "@/assets/images/icons/pencil_simple.png";
import DELETE_IMAGE from "@/assets/images/icons/delete.png";
import X_IMAGE from "@/assets/images/icons/x.png";

const BUTTON_ICON_STYLE: ImageStyle = {
    height: 24,
    width: 24,
}

export default function TempChangeDetailPage() {
    const { toast } = useToast();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [loading, setLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deleting, setDeleting] = useState(false);
    const [tempChange, setTempChange] = useState<TempChangeRecord | null>(null);

    const loadEvent = useCallback(async () => {
        try {
            setLoading(true);
            const idParam = Array.isArray(id) ? id?.[0] : id;
            const res = await getTempChangeById(idParam as string);
            if (res.success && res.data) {
                setTempChange(res.data);
            } else {
                setTempChange(null);
            }
        } catch (e) {
            setTempChange(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadEvent();
        }
    }, [id]);

    const handleBack = () => {
        router.back();
    }

    const handleEdit = () => {
        router.push({
            pathname: '/artist/calendar/temp-change/edit',
            params: { id: Array.isArray(id) ? id?.[0] : id }
        });
    }

    const handleDeleteConfirm = async () => {
        if (!id) return;

        try {
            setDeleting(true);
            const idParam = Array.isArray(id) ? id?.[0] : id;
            const res = await deleteTempChange(idParam as string);
            if (res.success) {
                setIsDeleteModalOpen(false);
                toast({ variant: 'success', title: 'Event deleted!', duration: 3000 });
                router.dismissTo('/artist/calendar');
            } else {
                toast({ variant: 'error', title: res.error || 'Failed to delete event', duration: 3000 });
            }
        } catch (e) {
            toast({ variant: 'error', title: 'Failed to delete event', duration: 3000 });
        } finally {
            setDeleting(false);
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
                    <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6">
                                    <View className="items-center justify-center pb-9">
                                        <Image
                                            source={APPOINTMENT_IMAGE}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Temporary Change</Text>
                                        <Text variant="h6" className="text-center uppercase">detail</Text>
                                    </View>
                                    {loading && (
                                        <View className="flex-1 items-center justify-center">
                                            <ActivityIndicator size="large" color="#fff" />
                                        </View>
                                    )}
                                    {tempChange && !loading && (
                                        <>
                                            <View className="gap-3">
                                                <Text className="text-text-secondary">Label</Text>
                                                <View className="flex-row gap-3">
                                                    <View className="w-4 h-4 bg-purple rounded-full mt-1" ></View>
                                                    <Text variant='h5'>Temporary change</Text>
                                                </View>
                                            </View>
                                            <View className="gap-2">
                                                <Text className="text-text-secondary">Start Date:</Text>
                                                <Text variant='h5'>{formatDate(tempChange?.start_date || '', false, true)}</Text>
                                            </View>
                                            <View className="gap-2">
                                                <Text className="text-text-secondary">End Date:</Text>
                                                <Text variant='h5'>{formatDate(tempChange?.end_date || '', false, true)}</Text>
                                            </View>
                                            <View className="gap-2">
                                                <Text className="text-text-secondary">Work Days:</Text>
                                                <Text variant='h5'>{tempChange?.work_days.map((day: string) => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}</Text>
                                            </View>
                                            <View className="gap-2">
                                                <Text className="text-text-secondary">Different Time Enabled:</Text>
                                                <Text variant='h5'>{tempChange?.different_time_enabled ? 'Yes' : 'No'}</Text>
                                            </View>
                                            {tempChange?.different_time_enabled ? (
                                                <>
                                                    {tempChange.work_days.map((day: string) => (
                                                        <View key={day} className="gap-2 flex-row items-start justify-between">
                                                            <View className="w-[80px]">
                                                                <Text className="text-text-secondary">{day.charAt(0).toUpperCase() + day.slice(1)}:</Text>
                                                            </View>
                                                            <View className="flex-1 gap-2">
                                                                <View>
                                                                    <Text className="text-text-secondary">Start Time:</Text>
                                                                    <Text variant='h5'>{formatTime(tempChange?.start_times?.[day] ?? '')}</Text>
                                                                </View>
                                                                <View>
                                                                    <Text className="text-text-secondary">End Time:</Text>
                                                                    <Text variant='h5'>{formatTime(tempChange?.end_times?.[day] ?? '')}</Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </>
                                            ) : (
                                                <View className="gap-2">
                                                    <View className="gap-2">
                                                        <Text className="text-text-secondary">Start Time:</Text>
                                                        <Text variant='h5'>{formatTime(tempChange?.start_times?.[tempChange?.work_days[0] ?? ''] ?? '')}</Text>
                                                    </View>
                                                    <View className="gap-2">
                                                        <Text className="text-text-secondary">End Time:</Text>
                                                        <Text variant='h5'>{formatTime(tempChange?.end_times?.[tempChange?.work_days[0] ?? ''] ?? '')}</Text>
                                                    </View>
                                                </View>
                                            )}

                                            {tempChange.location && (
                                                <View className="gap-2">
                                                    <Text className="text-text-secondary">Location:</Text>
                                                    <Text variant='h5'>{tempChange?.location?.address}</Text>
                                                </View>
                                            )}

                                            <View className="gap-2">
                                                <Text className="text-text-secondary">Notes:</Text>
                                                <Textarea
                                                    readOnly
                                                    value={tempChange?.notes || ''}
                                                    className="min-h-28"
                                                />
                                            </View>

                                        </>
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                        <View className="flex-row gap-3">
                            <Button onPress={() => setIsDeleteModalOpen(true)} variant="outline" size="lg" className="flex-1">
                                <Text variant='h5'>Delete</Text>
                                <Image source={DELETE_IMAGE} style={BUTTON_ICON_STYLE} />
                            </Button>
                            <Button onPress={handleEdit} variant="outline" size="lg" className="flex-1">
                                <Text variant='h5'>Edit</Text>
                                <Image source={PENCIL_SIMPLE} style={BUTTON_ICON_STYLE} />
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>

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
                                <Text variant="h3">Delete Event</Text>
                                <Text className="text-text-secondary text-center text-sm leading-5">Are you sure? This action can't be undone.</Text>
                            </View>
                            <View style={{ gap: 8, flexDirection: 'row' }}>
                                <View style={{ flex: 1 }}>
                                    <Button onPress={() => setIsDeleteModalOpen(false)} disabled={deleting} variant="outline" size='lg' className='items-center justify-center'>
                                        <Text>Cancel</Text>
                                    </Button>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Button onPress={handleDeleteConfirm} size='lg' disabled={deleting} className='items-center justify-center'>
                                        <Text>{deleting ? 'Deleting...' : 'Delete'}</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </>
    );
}