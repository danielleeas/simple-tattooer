import { useCallback, useEffect, useState } from "react";
import { View, Image, type ImageStyle, Pressable, Modal } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuth, useToast, useClient } from '@/lib/contexts';

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import PHONE_IMAGE from "@/assets/images/icons/phone.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";
import MONEYBAG_IMAGE from "@/assets/images/icons/money_bag.png";
import CHAT_IMAGE from "@/assets/images/icons/chat.png";
import SKELETON_IMAGE from "@/assets/images/icons/skeleton.png";
import CAMERA_IMAGE from "@/assets/images/icons/camera.png";
import DELETE_IMAGE from "@/assets/images/icons/delete.png";

const ICON_STYLE: ImageStyle = {
    height: 56,
    width: 56,
};

export default function ClientProfile() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { toast } = useToast();
    const { artist } = useAuth();
    const { client, loading, needsDrawing, loadClient } = useClient();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (id && !client || client?.id !== id) {
            loadClient(String(id));
        }
    }, [id, loadClient, client]);

    useFocusEffect(
        useCallback(() => {
            if (id && !client || client?.id !== id) {
                loadClient(String(id));
            }
        }, [id, loadClient, client])
    );

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissTo('/');
    };

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    const handleContact = () => {
        router.push(`/artist/clients/contact?id=${id}`);
    };

    const handleMoneyStuff = () => {
        router.push(`/artist/clients/money-stuff?id=${id}`);
    };

    const handleAppointments = () => {
        router.push(`/artist/clients/appointments?id=${id}`);
    };

    const handleMessages = () => {
        // router.push(`/production/messages/thread`);
    };

    const handlePhotos = () => {
        // router.push(`/production/clients/photos?id=${id}`);
    };

    const handleBlacklist = () => {
        if (isDeleteModalOpen) {
            setIsDeleteModalOpen(false);
        }
        setTimeout(() => {
            router.push('/')
            toast({
                variant: 'success',
                title: 'Client blacklisted - you can unblacklist this client again anytime manually.',
                duration: 3000,
            });
        }, 100);
    };

    const handleDelete = () => {
        if (isDeleteModalOpen) {
            setIsDeleteModalOpen(false);
        }
        setTimeout(() => {
            router.push('/')
            toast({
                variant: 'success',
                title: 'Client deleted - the client data successfully remove from your database.',
                duration: 3000,
            });
        }, 100);
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

    if (!client) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
                <SafeAreaView className='flex-1 bg-background'>
                    <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                    <View className="flex-1 justify-center items-center px-4">
                        <Text variant="h4" className="text-center">Client not found</Text>
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
                    <View className="flex-1 bg-background px-4 pt-2 pb-12 gap-6">
                        <View>
                            <Text variant="h3" className="text-center">Every tattoo starts</Text>
                            <Text variant="h3" className="text-center">with a person...</Text>
                        </View>
                        <View className="flex-1 items-center justify-center gap-8 bg-background">
                            <View className="gap-2 flex-1 w-full min-h-32 max-h-40 items-center justify-center flex-row">
                                <View className='w-1/3 h-full items-center justify-end'>
                                    <Pressable onPress={handleContact} className='items-center justify-end'>
                                        <Image source={PHONE_IMAGE} style={ICON_STYLE} />
                                        <Text variant="h6" className='uppercase'>Contact</Text>
                                        <Text variant="h6" className='uppercase leading-none'>info</Text>
                                    </Pressable>
                                </View>
                                <View className='w-1/3 h-full items-center justify-start min-w-24'>
                                    <Pressable onPress={handleAppointments} className='w-full items-center justify-start relative'>
                                        <Image source={APPOINTMENT_IMAGE} style={ICON_STYLE} />
                                        <Text
                                            variant="h6"
                                            className='uppercase w-40 text-center'
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                            minimumFontScale={0.8}
                                            style={{ position: 'absolute', top: 60 }}
                                        >appointments</Text>
                                    </Pressable>
                                </View>
                                <View className='w-1/3 h-full items-center justify-end'>
                                    <Pressable onPress={handleMoneyStuff} className='items-center justify-end'>
                                        <Image source={MONEYBAG_IMAGE} style={ICON_STYLE} />
                                        <Text variant="h6" className='uppercase'>money</Text>
                                        <Text variant="h6" className='uppercase leading-none'>stuff</Text>
                                    </Pressable>
                                </View>
                            </View>

                            <View className='w-full items-center justify-center gap-2'>
                                <View>
                                    <Text variant="h1" >{(client?.name || '').split(' ')[0]}</Text>
                                    <Text variant="h1" className="leading-none" >{(client?.name || '').split(' ').slice(1).join(' ')}</Text>
                                </View>
                                <View className="gap-2">
                                    {client.status === 'deposit_paid' ?
                                        (
                                            <Button size='sm' className='items-center justify-center py-1 px-2 h-6'>
                                                <Text className='text-xs'>DEPOSIT ON FILE</Text>
                                            </Button>
                                        )
                                        :
                                        (
                                            <Button size='sm' className='items-center justify-center py-1 px-2 h-6'>
                                                <Text className='text-xs'>NEEDS DEPOSIT</Text>
                                            </Button>
                                        )
                                    }
									{needsDrawing && (
										<Button size='sm' className='items-center justify-center p-1 h-6'>
											<Text className='text-xs'>NEEDS DRAWING</Text>
										</Button>
									)}
                                </View>
                            </View>

                            <View className="gap-4 mt-1 flex-1 w-full min-h-32 max-h-40 items-center justify-center flex-row">
                                <View className='flex-1 h-full items-center justify-start'>
                                    <Pressable onPress={handleMessages} className='items-center justify-start'>
                                        <Image source={CHAT_IMAGE} style={ICON_STYLE} />
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                            minimumFontScale={0.8}
                                            variant="h6"
                                            className='uppercase'
                                        >
                                            messages
                                        </Text>
                                    </Pressable>
                                </View>
                                <View className='flex-1 h-full items-center justify-end'>
                                    <Pressable onPress={() => setIsDeleteModalOpen(true)} className='items-center justify-end'>
                                        <Image source={SKELETON_IMAGE} style={ICON_STYLE} />
                                        <Text variant="h6" className='uppercase'>delete</Text>
                                    </Pressable>
                                </View>
                                <View className='flex-1 h-full items-center justify-start'>
                                    <Pressable onPress={handlePhotos} className='items-center justify-start'>
                                        <Image source={CAMERA_IMAGE} style={ICON_STYLE} />
                                        <Text variant="h6" className='uppercase'>Photos</Text>
                                    </Pressable>
                                </View>
                            </View>
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
                        <View className="w-full bg-background-secondary rounded-t-3xl p-6 gap-6">
                            <View className="gap-2 flex-row">
                                <View className="gap-2 flex-1 items-center justify-center">
                                    <Image source={SKELETON_IMAGE} style={{ width: 80, height: 80 }} />
                                    <Button onPress={handleBlacklist} variant="outline" className='items-center justify-center w-full'>
                                        <Text>Blacklist</Text>
                                    </Button>
                                    <Text className="text-text-secondary text-center max-w-[135px] leading-5">Prevent this client from booking again.Cannot undone.</Text>
                                </View>

                                <View className="gap-2 flex-1 items-center justify-start">
                                    <Image source={DELETE_IMAGE} style={{ width: 80, height: 80 }} />
                                    <Button onPress={handleDelete} variant="outline" className='items-center justify-center w-full'>
                                        <Text>Delete</Text>
                                    </Button>
                                    <Text className="text-text-secondary text-center max-w-[152px] leading-5">Permanently remove from the system.Will lose all info.</Text>
                                </View>
                            </View>
                            <View className="gap-2">
                                <Button onPress={() => setIsDeleteModalOpen(false)} variant="outline" size='lg' className='items-center justify-center w-full'>
                                    <Text>Cancel</Text>
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </>
    );
}
