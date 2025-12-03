import { useEffect, useMemo, useState } from "react";
import { View, Image, type ImageStyle, Pressable, ScrollView, Modal, Dimensions } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, useToast } from "@/lib/contexts";
import { getClientProjectsWithSessions, getSessionById } from "@/lib/services/clients-service";
import { deleteSessionById } from "@/lib/services/booking-service";
import { type DrawingRow } from "@/lib/services/drawing-service";
import { formatDbDate } from "@/lib/utils";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";

export default function ClientDetailSession() {
    const _params = (useLocalSearchParams<'/artist/clients/detail-session'>() ?? {}) as Record<string, string | string[] | undefined>;
    const client_id = (Array.isArray(_params.client_id) ? _params.client_id[0] : _params.client_id) as string | undefined;
    const project_id = (Array.isArray(_params.project_id) ? _params.project_id[0] : _params.project_id) as string | undefined;
    const session_id = (Array.isArray(_params.session_id) ? _params.session_id[0] : _params.session_id) as string | undefined;
    const { artist } = useAuth();
    const { toast } = useToast();

    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [session, setSession] = useState<any | null>(null);
    const [drawing, setDrawing] = useState<DrawingRow | null>(null);
    const [clientName, setClientName] = useState<string>('');
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    useEffect(() => {
        let isMounted = true;
        async function load() {
            if (!artist?.id || !session_id) {
                if (isMounted) {
                    setSession(null);
                    setDrawing(null);
                    setLoading(false);
                }
                return;
            }
            setLoading(true);
            try {
				// Determine client_id/project_id if missing by loading the session
				let effectiveClientId: string | null = client_id ? String(client_id) : null;
				let effectiveProjectId: string | null = project_id ? String(project_id) : null;
				let sessionFromId: any | null = null;

				if (!effectiveClientId || !effectiveProjectId) {
					sessionFromId = await getSessionById(String(session_id));
					if (!sessionFromId) {
						if (isMounted) {
							setSession(null);
							setDrawing(null);
							setLoading(false);
                            setClientName('');
						return;
					}
					}
					if (!effectiveProjectId) {
						effectiveProjectId = String(sessionFromId?.project?.id || sessionFromId?.project_id || '');
					}
					if (!effectiveClientId) {
						effectiveClientId = String(sessionFromId?.project?.client_id || sessionFromId?.project?.client?.id || '');
					}
				}

				// Preferred path: if client id is available, load project(s) and filter session
				const projects = effectiveClientId
					? await getClientProjectsWithSessions(String(artist.id), String(effectiveClientId))
					: [];
				const project = (projects || []).find((p: any) => String(p?.id) === String(effectiveProjectId));

                let d: DrawingRow | null = null;
                if (project?.drawing) {
                    const drawingRow = Array.isArray(project.drawing) ? project.drawing[0] : project.drawing;
                    d = drawingRow ?? null;
                }

				const s = (project?.sessions || []).find((sess: any) => String(sess?.id) === String(session_id)) || sessionFromId || null;
                const name = s?.project?.client?.full_name || project?.client?.full_name || '';

                if (isMounted) {
                    setSession(s);
                    setDrawing(d);
                    setClientName(name);
                }
            } catch {
                if (isMounted) {
                    setSession(null);
                    setDrawing(null);
                    setClientName('');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        load();
        return () => { isMounted = false; };
    }, [artist?.id, client_id, project_id, session_id]);

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    };

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    // Helpers to display time ranges from HH:MM (24h) + duration minutes
    const toShortDisplayTime = (hhmm?: string): string => {
        if (!hhmm) return '';
        const [hStr, mStr] = hhmm.split(':');
        const hours24 = Number(hStr);
        const minutes = Number(mStr);
        const period = hours24 < 12 ? 'am' : 'pm';
        const hours12 = ((hours24 + 11) % 12) + 1;
        const minutesPart = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;
        return `${hours12}${minutesPart}${period}`;
    };
    const addMinutesToHHMM = (hhmm?: string, minutesToAdd?: number): string => {
        if (!hhmm || typeof minutesToAdd !== 'number') return hhmm || '';
        const [hStr, mStr] = hhmm.split(':');
        const base = new Date(0, 0, 1, Number(hStr), Number(mStr));
        base.setMinutes(base.getMinutes() + minutesToAdd);
        const h = base.getHours();
        const m = base.getMinutes();
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    const toDisplayRange = (start?: string, durationMinutes?: number): string => {
        if (!start) return '';
        const end = addMinutesToHHMM(start, durationMinutes ?? 0);
        if (!durationMinutes || durationMinutes <= 0) return toShortDisplayTime(start);
        return `${toShortDisplayTime(start)} - ${toShortDisplayTime(end)}`;
    };

    const handleDeleteConfirm = async () => {
        if (!session_id) {
            setIsDeleteModalOpen(false);
            return;
        }
        try {
            const res = await deleteSessionById(String(session_id));
            if (!res.success) {
                toast?.({ variant: 'error', title: 'Failed to delete session', description: res.error || 'Please try again' });
                return;
            }
            toast?.({ variant: 'success', title: 'Session deleted' });
            setIsDeleteModalOpen(false);
            router.back();
        } catch (e: any) {
            toast?.({ variant: 'error', title: 'Unexpected error', description: e?.message || 'Please try again' });
        }
    };

    const handleEditSession = () => {

        console.log(project_id, session_id)
        router.push({
            pathname: '/artist/clients/edit-session',
            params: { projectId: project_id, sessionId: session_id }
        });
    };

    const handleImagePress = (source: any) => {
        setSelectedImageSource(source);
        setIsImageViewerVisible(true);
    };

    const handleCloseImageViewer = () => {
        setIsImageViewerVisible(false);
        setSelectedImageSource(null);
    };

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
                <SafeAreaView className='flex-1 bg-background'>
                    <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                    <View className="flex-1 justify-center items-center px-4">
                        <Text variant="h4" className="text-center">Loading...</Text>
                    </View>
                </SafeAreaView>
            </>
        );
    }

    if (!session) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
                <SafeAreaView className='flex-1 bg-background'>
                    <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                    <View className="flex-1 justify-center items-center px-4">
                        <Text variant="h4" className="text-center">Session not found</Text>
                    </View>
                </SafeAreaView>
            </>
        );
    }

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
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6 pb-6">
                                    <View className="items-center justify-center pb-[16px] h-[120px]">
                                        <Image
                                            source={require('@/assets/images/icons/appointment.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Session</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Detail Page</Text>
                                    </View>
                                    <View className="gap-4">
                                        <View className="flex-row items-center gap-2">
                                            <View className="w-4 h-4 rounded-full bg-purple" />
                                            <Text variant="h4">{clientName || 'Client'}</Text>
                                        </View>
                                        <View className="gap-3 flex-row items-start">
                                            <View className="flex-1 max-w-[120px]">
                                                <Text>{formatDbDate(session?.date, 'MMM DD, YYYY')}</Text>
                                            </View>
                                            <View className="flex-1 gap-1" >
                                                <Text>{toDisplayRange(session?.start_time, session?.duration)}</Text>
                                                <Text>{session?.location?.address || ''}</Text>
                                            </View>
                                        </View>

                                        <View className="gap-3 flex-row items-start">
                                            <View className="flex-1 max-w-[120px]">
                                                {drawing?.image_url && (
                                                    <Pressable onPress={() => handleImagePress({ uri: drawing?.image_url })} className="w-[120px] h-[120px] rounded-lg overflow-hidden">
                                                        <Image
                                                            source={drawing?.image_url ? { uri: drawing.image_url } : require('@/assets/images/tattoos/tattooer_1.png')}
                                                            style={{ width: 100, height: 100 }}
                                                            resizeMode="contain"
                                                        />
                                                    </Pressable>
                                                )}
                                            </View>
                                            <View className="flex-1 gap-3" >
                                                <View className="gap-1">
                                                    <Text variant="h5">Session Rate</Text>
                                                    <Text>${session?.session_rate ?? 0}</Text>
                                                </View>
                                                <View className="gap-1">
                                                    <Text variant="h5">History</Text>
                                                    <Text className="text-text-secondary">Client has rescheduled {session?.reschedule_count ?? 0}x</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <View className="gap-2">
                                        <Text className="text-text-secondary">Notes</Text>
                                        <Textarea
                                            placeholder="Enter notes"
                                            className="min-h-28"
                                            value={session?.notes || ''}
                                            readOnly
                                        />
                                    </View>
                                    <View className="gap-3">
                                        <Text variant="h4">If you need to reschedule, tap below</Text>
                                        <Button onPress={() => setIsRescheduleModalOpen(true)} variant="outline" className='items-center justify-center'>
                                            <Text variant="h5">Reschedule & Email Client</Text>
                                        </Button>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>

                        <View className="gap-4 items-center justify-center flex-row">
                            <Button onPress={() => setIsDeleteModalOpen(true)} variant="outline" size="lg" className="flex-1">
                                <Text variant='h5'>Delete</Text>
                                <Image source={require('@/assets/images/icons/delete.png')} style={{ width: 28, height: 28 }} />
                            </Button>
                            <Button onPress={handleEditSession} size="lg" variant="outline" className="flex-1">
                                <Text variant='h5'>Edit</Text>
                                <Image source={require('@/assets/images/icons/pencil_simple.png')} style={{ width: 28, height: 28 }} />
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>

                <Modal
                    visible={isRescheduleModalOpen}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsRescheduleModalOpen(false)}
                >
                    <View className="flex-1 justify-end items-center bg-black/50">
                        <View className="bg-background-secondary p-4 pt-10 pb-8 rounded-t-[40px] w-full">
                            <Text variant="h4" className="text-xl mb-4">Why do you need to reschedule?</Text>
                            <View className="gap-2">
                                <Text className="text-sm text-text-secondary">We will send an email & alert to your client, as well as your calendar to pick a new date. </Text>
                                <View className="mt-4">
                                    <Textarea
                                        placeholder="Type your message here"
                                        className="min-h-28"
                                    />
                                </View>
                            </View>
                            <View className="mt-6 flex-row gap-2">
                                <View className="flex-1">
                                    <Button onPress={() => setIsRescheduleModalOpen(false)} variant="outline" size='lg' className='items-center justify-center w-full'>
                                        <Text>Cancel</Text>
                                    </Button>
                                </View>
                                <View className="flex-1">
                                    <Button variant="outline" onPress={() => setIsRescheduleModalOpen(false)} size='lg' className='items-center justify-center w-full'>
                                        <Text>Send Email</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isDeleteModalOpen}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsDeleteModalOpen(false)}
                >
                    <View className="flex-1 bg-black/50 justify-end items-center">
                        <View className="w-full bg-background-secondary rounded-t-3xl p-4 pt-8 pb-8 gap-6">
                            <View style={{ gap: 8, alignItems: 'center', height: 200 }}>
                                <Image source={require('@/assets/images/icons/warning_circle.png')} style={{ width: 80, height: 80 }} />
                                <Text variant="h3">Delete Session</Text>
                                <Text className="text-text-secondary text-center text-sm leading-5">Are you sure? This action can't be undone.</Text>
                            </View>
                            <View style={{ gap: 8, flexDirection: 'row' }}>
                                <View style={{ flex: 1 }}>
                                    <Button onPress={() => setIsDeleteModalOpen(false)} variant="outline" size='lg' className='items-center justify-center'>
                                        <Text>Cancel</Text>
                                    </Button>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Button variant="outline" onPress={handleDeleteConfirm} size='lg' className='items-center justify-center'>
                                        <Text>Delete</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isImageViewerVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={handleCloseImageViewer}
                >
                    <View className="flex-1 bg-black/90 justify-center items-center">
                        <Pressable
                            className="absolute top-4 right-4 z-10"
                            onPress={handleCloseImageViewer}
                        >
                            <View className="bg-white/20 rounded-full p-2">
                                <Image
                                    source={require('@/assets/images/icons/x_circle.png')}
                                    style={{ width: 32, height: 32 }}
                                    resizeMode="contain"
                                />
                            </View>
                        </Pressable>

                        <Pressable
                            className="flex-1 w-full justify-center items-center"
                            onPress={handleCloseImageViewer}
                        >
                            <Image
                                source={selectedImageSource}
                                style={{
                                    width: screenWidth - 40,
                                    height: screenHeight - 100,
                                    maxWidth: screenWidth,
                                    maxHeight: screenHeight
                                }}
                                resizeMode="contain"
                            />
                        </Pressable>
                    </View>
                </Modal>

            </SafeAreaView>
        </>
    );
}
