import { useCallback, useEffect, useState } from "react";
import { View, Image, type ImageStyle, ScrollView, Modal, ActivityIndicator } from "react-native";
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
import { deleteOffDay, getOffDayById, type OffDayRecord } from "@/lib/services/calendar-service";
import { formatDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const BUTTON_ICON_STYLE: ImageStyle = {
    height: 24,
    width: 24,
}

export default function OffDaysDetailPage() {
    const { toast } = useToast();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const { id } = useLocalSearchParams<{ id: string }>();
    const [offDay, setOffDay] = useState<OffDayRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadOffDay = useCallback(async () => {
        try {
            setLoading(true);
            const idParam = Array.isArray(id) ? id?.[0] : id;
            const res = await getOffDayById(idParam as string);
            if (res.success && res.data) {
                setOffDay(res.data);
            } else {
                setOffDay(null);
            }
        } catch (e) {
            setOffDay(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadOffDay();
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadOffDay();
        }, [loadOffDay])
    );

    const handleBack = () => {
        router.back();
    };

    const handleEdit = () => {
        router.push({
            pathname: '/artist/calendar/off-days/edit',
            params: { id: Array.isArray(id) ? id?.[0] : id }
        });
    }

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            const idParam = Array.isArray(id) ? id?.[0] : id;
            const res = await deleteOffDay(idParam as string);
            if (!res.success) {
                toast({ variant: 'error', title: res.error || 'Failed to delete off day', duration: 3000 });
                return;
            }
            setIsDeleteModalOpen(false);
            toast({ variant: 'success', title: 'Event deleted!', duration: 3000 });
            router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        } catch (e) {
            toast({ variant: 'error', title: 'Failed to delete event', duration: 3000 });
        } finally {
            setDeleting(false);
        }
    };

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
                                        <Text variant="h6" className="text-center uppercase">Multiple Days</Text>
                                        <Text variant="h6" className="text-center uppercase">Off detail</Text>
                                    </View>
                                    {loading && (
                                        <View className="flex-1 items-center justify-center">
                                            <ActivityIndicator size="large" color="#fff" />
                                        </View>
                                    )}

                                    {offDay && !loading && (
                                        <>
                                            <View className="gap-3">
                                                <Text className="text-text-secondary">Title</Text>
                                                <Text variant='h5'>{offDay?.title}</Text>
                                            </View>

                                            <View className="gap-3">
                                                <Text className="text-text-secondary">Label</Text>
                                                <View className="flex-row gap-3">
                                                    <View className="w-4 h-4 bg-blue-500 rounded-full mt-1" ></View>
                                                    <Text variant='h5'>Book Off Multiple Days</Text>
                                                </View>
                                            </View>

                                            <View className="gap-3">
                                                <Text className="text-text-secondary">Start Date</Text>
                                                <Text variant='h5'>{formatDate(offDay?.start_date || '', false, true)}</Text>
                                            </View>

                                            <View className="gap-3">
                                                <Text className="text-text-secondary">End Time</Text>
                                                <Text variant='h5'>{formatDate(offDay?.end_date || '', false, true)}</Text>
                                            </View>

                                            {offDay?.is_repeat && (
                                                <View className="gap-3">
                                                    <Text >Repeat {offDay?.repeat_type} for {offDay?.repeat_duration} {offDay?.repeat_duration_unit}</Text>
                                                </View>
                                            )}

                                            <View className="gap-3">
                                                <Text className="text-text-secondary">Notes</Text>
                                                <Textarea
                                                    readOnly
                                                    value={offDay?.notes || ''}
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