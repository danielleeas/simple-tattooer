import { useEffect, useState } from "react";
import { View, Image, type ImageStyle, Pressable, ScrollView, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import ClientHeader from '@/components/lib/client-header';
import { Text } from "@/components/ui/text";
import { AvatarPicker } from "@/components/lib/avatar-picker";
import { Input } from "@/components/ui/input";
import { ArrowUp, Search } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
// import { MobileDialog, MobileDialogContent, MobileDialogTitle } from '@/components/lib/mobile-dialog';
import { Textarea } from "@/components/ui/textarea";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
// import { messages } from "@/lib/mocks";

const messages = [
    {
        id: '1',
        name: 'Michael Josh',
        date: new Date('2025-07-28'),
        message: "Message preview here",
        time: '07.00am',
        image: require('@/assets/images/tattoos/tattoos_2.png'),
        isRead: false,
    },
    {
        id: '2',
        name: 'Sara Lee',
        date: new Date('2025-07-28'),
        message: "Your tattoo booking has been confirmed! Please",
        time: '08.30am',
        image: require('@/assets/images/tattoos/tattoos_2.png'),
        isRead: false,
    },
    {
        id: '3',
        name: 'James Tan',
        date: new Date('2025-07-28'),
        message: "Don't forget about the tattoo consultation meeting tomorrow!",
        time: 'Yesterday',
        image: require('@/assets/images/tattoos/tattoos_2.png'),
        isRead: false,
    },
    {
        id: '4',
        name: 'Emily Chen',
        date: new Date('2025-07-28'),
        message: "We need your feedback on the tattoo design draft before finalizing.",
        time: 'Sunday',
        image: require('@/assets/images/tattoos/tattoos_2.png'),
        isRead: false,
    },
    {
        id: '5',
        name: 'David Kim',
        date: new Date('2025-07-28'),
        message: "Task assignment for the tattoo artists for the upcoming sessions.",
        time: 'Saturday',
        image: require('@/assets/images/tattoos/tattoos_2.png'),
        isRead: false,
    },
]

export default function ClientMessages() {
    const router = useRouter();

    const [messageAllClientsModalOpen, setMessageAllClientsModalOpen] = useState(false);

    // Get dynamic screen options based on navigation animation

    const handleBack = () => {
        router.back();
    };

    const shortDescription = (description: string) => {
        return description.length > 43 ? description.substring(0, 43) + '...' : description;
    }

    const makeUserShortName = (name: string) => {
        return name.split(' ').map(word => word[0]).join('');
    }

    const handleMessageThread = (id: string) => {
        router.push('/client/message/thread');
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <ClientHeader
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                    title="Messages"
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

                                    <View className="flex-row gap-2 items-center justify-between">
                                        <Text className="text-text-secondary text-xs">Sort by</Text>
                                        <View className="flex-row gap-2 items-center">
                                            <Icon as={ArrowUp} size={16} strokeWidth={1} />
                                            <Text className="text-text-secondary text-xs">Sort by</Text>
                                        </View>
                                    </View>

                                    <View className="gap-6">
                                        {messages.map((message: any) => (
                                            <Pressable key={message.id} onPress={() => handleMessageThread(message.id)} className="flex-row gap-2">
                                                {/* <AvatarPicker
                                                    initialImage={message.image}
                                                    isCircle={true}
                                                    className="size-12"
                                                /> */}
                                                <View className="flex-1 justify-between">
                                                    <View className="flex-row justify-between pt-1">
                                                        <Text variant="h5">{message.name}</Text>
                                                        <Text className="text-text-tertiary text-xs">{message.time}</Text>
                                                    </View>
                                                    <Text variant="small" className="text-text-secondary">{shortDescription(message.message)}</Text>
                                                </View>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </View>

                    {/* <MobileDialog open={messageAllClientsModalOpen} onOpenChange={setMessageAllClientsModalOpen}>
                        <MobileDialogContent showCloseButton={false} className="gap-6">
                            <MobileDialogTitle className="hidden">Message all clients</MobileDialogTitle>
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
                                    <Button onPress={() => setMessageAllClientsModalOpen(false)} size='lg' className='items-center justify-center'>
                                        <Text>Send Message</Text>
                                    </Button>
                                </View>
                            </View>
                        </MobileDialogContent>
                    </MobileDialog> */}
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
