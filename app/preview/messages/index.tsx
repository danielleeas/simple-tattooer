import { useState } from "react";
import { View, Image, Pressable, ScrollView, Modal } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { ArrowUp, Search } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

export default function Messages() {
    const router = useRouter();

    const [messageAllClientsModalOpen, setMessageAllClientsModalOpen] = useState(false);

    // Get dynamic screen options based on navigation animation

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/preview/menu');
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
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6 pb-6">
                                    <View className="items-center justify-start h-[120px] relative">
                                        <Image
                                            source={require('@/assets/images/icons/message.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">messages</Text>
                                    </View>

                                    <View className="flex-1">
                                        <Input style={{ height: 34 }} placeholder="Search" leftIcon={Search} className="w-full border-border bg-background-secondary rounded-lg" />
                                    </View>

                                    <View className="gap-6">
                                        <View className="flex-1 items-center justify-center w-[80%] mx-auto gap-4 min-h-[300px]">
                                            <Image
                                                source={require('@/assets/images/icons/chat_slash.png')}
                                                style={{ width: 64, height: 64 }}
                                                resizeMode="contain"
                                            />
                                            <Text className="text-text-secondary text-center">You have no messages yet. Start a conversation to see them here!</Text>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                        <View className="items-center justify-center w-full">
                            <Pressable onPress={() => setMessageAllClientsModalOpen(true)} className="px-3 py-2 border border-border-secondary rounded-full">
                                <Text className="text-xs text-text-secondary" style={{ lineHeight: 14 }}>Message all  clients</Text>
                            </Pressable>
                        </View>
                    </View>

                    <Modal
                        visible={messageAllClientsModalOpen}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setMessageAllClientsModalOpen(false)}
                    >
                        <View className="flex-1 justify-end items-center bg-black/50">
                            <View className="bg-background-secondary rounded-t-[40px] p-6 w-full gap-6">
                                <View className="gap-2 w-full">
                                    <Text variant="h5">
                                        Message all clients
                                    </Text>
                                    <Text variant="small" className="mb-4">
                                        Send a single message to all clients at once.
                                    </Text>
                                    <Textarea placeholder="Type your message here" className="min-h-28" />
                                </View>
                                <View className="gap-2 flex-row">
                                    <View className="flex-1">
                                        <Button onPress={() => setMessageAllClientsModalOpen(false)} variant="outline" size='lg' className='items-center justify-center'>
                                            <Text>Cancel</Text>
                                        </Button>
                                    </View>
                                    <View className="flex-1">
                                        <Button variant="outline" onPress={() => setMessageAllClientsModalOpen(false)} size='lg' className='items-center justify-center'>
                                            <Text>Send Message</Text>
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
