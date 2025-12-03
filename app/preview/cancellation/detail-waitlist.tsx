import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { View, Image, ScrollView, Modal } from "react-native";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/lib/contexts/toast-context";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";


export default function DetailWaitlist() {
    const { toast } = useToast();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/preview/menu');
    };

    const handleWaitlistAssignConfirm = () => {
        setIsDeleteModalOpen(false);
        toast({
            variant: 'success',
            title: 'Waitlist successfully assign!',
            description: 'We have update your calendar and notify the client.',
            duration: 3000,
        });
        router.push('/');
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={HOME_IMAGE}
                    leftButtonTitle="Today"
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
                    <View className="flex-1 pt-2 pb-4 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-7">
                                    <View className="items-center justify-center" style={{ height: 120 }}>
                                        <Image
                                            source={require('@/assets/images/icons/love.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Liam</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Carter</Text>
                                    </View>
                                    <View className="gap-2">
                                        <Text className="text-text-secondary">Date client eligible</Text>
                                        <Text variant="h5">July 7-20; August, 1-20</Text>
                                    </View>
                                    <View className="gap-2">
                                        <Text className="text-text-secondary">Project priority</Text>
                                        <Text variant="h5">High</Text>
                                    </View>
                                    <View className="gap-2">
                                        <Text className="text-text-secondary">Available days</Text>
                                        <Text variant="h5">Sunday, Monday, Tuesday, Friday, and Saturday</Text>
                                    </View>
                                    <View className="gap-2">
                                        <Text className="text-text-secondary">Available times</Text>
                                        <Text variant="h5">09.00am - 12.00pm, 03.00pm - 05.00pm</Text>
                                    </View>
                                    <View className="gap-2">
                                        <Text className="text-text-secondary">Project Title</Text>
                                        <Text variant="h5">Eternal Waves Inked Dreams. Full hand sleeve.</Text>
                                    </View>
                                    <View className="gap-2">
                                        <Text className="text-text-secondary">Private artist note</Text>
                                        <Text variant="h5">This design is inspired by the ocean's depths, capturing the essence of eternal waves. I look forward to bringing your vision to life!</Text>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                        <View className="gap-4 px-4 pt-4">
                            <Button onPress={() => setIsDeleteModalOpen(true)} variant="outline">
                                <Text>Email Client</Text>
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
                            <View className="w-full bg-background-secondary rounded-t-3xl p-6 gap-6">
                                <View className="gap-2 items-center">
                                    <Image source={require('@/assets/images/icons/warning_circle.png')} style={{ width: 80, height: 80 }} />
                                    <Text variant="h3" className="text-center">Assign waitlist to Liam Carter</Text>
                                    <Text className="text-text-secondary text-center text-sm leading-5">Are you sure? As this will automatically update your calendar & notify the client.</Text>
                                </View>
                                <View className="gap-2 flex-row">
                                    <View className="flex-1">
                                        <Button onPress={() => setIsDeleteModalOpen(false)} variant="outline" size='lg' className='items-center justify-center'>
                                            <Text>Cancel</Text>
                                        </Button>
                                    </View>
                                    <View className="flex-1">
                                        <Button variant="outline" onPress={handleWaitlistAssignConfirm} size='lg' className='items-center justify-center'>
                                            <Text>Assign</Text>
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