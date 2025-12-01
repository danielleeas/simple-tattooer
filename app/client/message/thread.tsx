import { useEffect, useState, useRef } from "react";
import { View, Image, type ImageStyle, Pressable, FlatList, Platform, TextInput, KeyboardAvoidingView, Keyboard, Dimensions } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Stack, useRouter } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import ClientHeader from "@/components/lib/client-header";
import { Text } from "@/components/ui/text";
import { ArrowUp, Search, Send, Image as ImageIcon } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { MessageBubble } from "./message-bubble";
import { Message } from "@/lib/types";

import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { useKeyboardHandler } from "react-native-keyboard-controller";

const michaelJoshMessages = [
    {
        id: '1',
        text: "Hey Crystal, just checking in to confirm our tattoo appointment. I'm really excited to see the design you created!",
        sender: 'other' as const,
        senderName: 'Michael Josh',
        timestamp: '07:00am',
        date: new Date('2025-01-15T07:00:00'),
        isRead: true,
        avatar: 'MJ'
    },
    {
        id: '2',
        text: "Hi Michael! Thanks for reaching out. I'm all set for our tattoo appointment and can't wait to show you the design! If there's anything specific you'd like to discuss or prepare, just let me know!",
        sender: 'user' as const,
        senderName: 'Crystal Alexandria (You)',
        timestamp: '07:12am',
        date: new Date('2025-01-15T07:12:00'),
        isRead: true,
        avatar: 'CA'
    },
    {
        id: '3',
        text: "Great nice to hear that, see you tomorrow! Hope you have a great day!",
        sender: 'other' as const,
        senderName: 'Michael Josh',
        timestamp: '07:14am',
        date: new Date('2025-01-15T07:14:00'),
        isRead: true,
        avatar: 'MJ'
    },
    {
        id: '4',
        text: "You too! See you tomorrow!",
        sender: 'user' as const,
        senderName: 'Crystal Alexandria (You)',
        timestamp: '07:15am',
        date: new Date('2025-01-15T07:15:00'),
        isRead: true,
        avatar: 'CA'
    },
    {
        id: '5',
        text: "Hey Crystal, I was thinking about the placement. Do you think the inner forearm would work better than the outer arm?",
        sender: 'other' as const,
        senderName: 'Michael Josh',
        timestamp: '08:30am',
        date: new Date('2025-01-15T08:30:00'),
        isRead: true,
        avatar: 'MJ'
    },
    {
        id: '6',
        text: "That's a great question! The inner forearm would definitely be more visible to you, but it might be a bit more sensitive. We can discuss the pros and cons when you come in tomorrow.",
        sender: 'user' as const,
        senderName: 'Crystal Alexandria (You)',
        timestamp: '08:45am',
        date: new Date('2025-01-15T08:45:00'),
        isRead: true,
        avatar: 'CA'
    },
    {
        id: '7',
        text: "Perfect! I'm also wondering about the size. I want it to be detailed but not too overwhelming. What do you think?",
        sender: 'other' as const,
        senderName: 'Michael Josh',
        timestamp: '09:00am',
        date: new Date('2025-01-15T09:00:00'),
        isRead: true,
        avatar: 'MJ'
    },
    {
        id: '8',
        text: "I've designed it to be about 4 inches, which should give us enough space for all the details while keeping it proportional. The design has a lot of fine line work that will look amazing at that size!",
        sender: 'user' as const,
        senderName: 'Crystal Alexandria (You)',
        timestamp: '09:15am',
        date: new Date('2025-01-15T09:15:00'),
        isRead: true,
        avatar: 'CA'
    },
    {
        id: '9',
        text: "That sounds perfect! I'm getting more excited by the minute. Should I bring anything special for tomorrow?",
        sender: 'other' as const,
        senderName: 'Michael Josh',
        timestamp: '09:30am',
        date: new Date('2025-01-15T09:30:00'),
        isRead: true,
        avatar: 'MJ'
    },
    {
        id: '10',
        text: "Just make sure to eat a good meal beforehand and stay hydrated! I'll have everything else we need. See you at 2 PM tomorrow!",
        sender: 'user' as const,
        senderName: 'Crystal Alexandria (You)',
        timestamp: '09:45am',
        date: new Date('2025-01-15T09:45:00'),
        isRead: true,
        avatar: 'CA'
    },
    {
        id: '11',
        text: "Awesome! Thanks for all the info. I'll see you tomorrow at 2 PM. Can't wait!",
        sender: 'other' as const,
        senderName: 'Michael Josh',
        timestamp: '10:00am',
        date: new Date('2025-01-15T10:00:00'),
        isRead: true,
        avatar: 'MJ'
    },
    {
        id: '12',
        text: "Perfect! I'm really looking forward to working on this piece with you. It's going to look amazing!",
        sender: 'user' as const,
        senderName: 'Crystal Alexandria (You)',
        timestamp: '10:15am',
        date: new Date('2025-01-15T10:15:00'),
        isRead: true,
        avatar: 'CA'
    },
    {
        id: '13',
        text: "Hey Crystal, I'm running about 10 minutes late. Traffic is crazy today!",
        sender: 'other' as const,
        senderName: 'Michael Josh',
        timestamp: '01:50pm',
        date: new Date('2025-01-16T13:50:00'),
        isRead: true,
        avatar: 'MJ'
    },
    {
        id: '14',
        text: "No worries at all! Take your time and drive safely. I'll be here when you arrive.",
        sender: 'user' as const,
        senderName: 'Crystal Alexandria (You)',
        timestamp: '01:52pm',
        date: new Date('2025-01-16T13:52:00'),
        isRead: true,
        avatar: 'CA'
    },
    {
        id: '15',
        text: "Thanks for being so understanding! I'm pulling into the parking lot now.",
        sender: 'other' as const,
        senderName: 'Michael Josh',
        timestamp: '02:05pm',
        date: new Date('2025-01-16T14:05:00'),
        isRead: true,
        avatar: 'MJ'
    },
    {
        id: '16',
        text: "Perfect timing! Come on in, I'm ready for you.",
        sender: 'user' as const,
        senderName: 'Crystal Alexandria (You)',
        timestamp: '02:06pm',
        date: new Date('2025-01-16T14:06:00'),
        isRead: true,
        avatar: 'CA'
    },
    {
        id: '17',
        text: "Wow! The design looks even better in person than I imagined. I love how the shading creates depth!",
        sender: 'other' as const,
        senderName: 'Michael Josh',
        timestamp: '02:30pm',
        date: new Date('2025-01-16T14:30:00'),
        isRead: true,
        avatar: 'MJ'
    },
    {
        id: '18',
        text: "I'm so glad you love it! The shading is going to make it really pop. Are you ready to get started?",
        sender: 'user' as const,
        senderName: 'Crystal Alexandria (You)',
        timestamp: '02:32pm',
        date: new Date('2025-01-16T14:32:00'),
        isRead: true,
        avatar: 'CA'
    },
    {
        id: '19',
        text: "Absolutely! I'm ready when you are. This is going to be amazing!",
        sender: 'other' as const,
        senderName: 'Michael Josh',
        timestamp: '02:35pm',
        date: new Date('2025-01-16T14:35:00'),
        isRead: true,
        avatar: 'MJ'
    },
    {
        id: '20',
        text: "Great! Let's make some art together! 🎨",
        sender: 'user' as const,
        senderName: 'Crystal Alexandria (You)',
        timestamp: '02:36pm',
        date: new Date('2025-01-16T14:36:00'),
        isRead: true,
        avatar: 'CA'
    }
];

const useGradualAnimation = () => {
    const height = useSharedValue(0);

    useKeyboardHandler(
        {
            onMove: event => {
                'worklet';
                height.value = Math.max(event.height, 0);
            },
        },
        []
    );
    return { height };
};

export default function MessageThread() {
    const router = useRouter();

    const { height } = useGradualAnimation();

    const [messageText, setMessageText] = useState("");
    const [textAreaHeight, setTextAreaHeight] = useState(40);
    const [messages, setMessages] = useState<Message[]>(michaelJoshMessages);
    const flatListRef = useRef<FlatList>(null);

    const fakeView = useAnimatedStyle(() => {
        return {
            height: Math.abs(height.value)-21,
        };
    }, []);

    const handleBack = () => {
        router.back();
    };

    const handleContentSizeChange = (event: any) => {
        const { height } = event.nativeEvent.contentSize;
        const minHeight = 40;
        const maxHeight = 200;
        const newHeight = Math.max(minHeight, Math.min(maxHeight, height));
        setTextAreaHeight(newHeight);
    };

    const handleSendMessage = () => {
        if (messageText.trim()) {
            const newMessage: Message = {
                id: Date.now().toString(),
                text: messageText.trim(),
                sender: 'user',
                senderName: 'Crystal Alexandria (You)',
                timestamp: new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }).toLowerCase(),
                date: new Date(),
                isRead: true,
                avatar: 'CA'
            };

            setMessages(prev => [...prev, newMessage]);
            setMessageText('');

            // Scroll to bottom after sending
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <ClientHeader
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                    title="Michael Josh"
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4 pt-2">
                        <View className="flex-1">
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                renderItem={({ item }) => <MessageBubble message={item} />}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{
                                    paddingTop: 20,
                                    paddingBottom: 20,
                                    gap: 28
                                }}
                                ListHeaderComponent={() => (
                                    <View className="items-center mb-4">
                                        <View className="px-3 py-1 border border-border rounded-full bg-button-label">
                                            <Text className="text-xs text-text-secondary">Today 10:30am</Text>
                                        </View>
                                    </View>
                                )}
                                onContentSizeChange={() => {
                                    // Auto-scroll to bottom when content changes
                                    setTimeout(() => {
                                        flatListRef.current?.scrollToEnd({ animated: true });
                                    }, 100);
                                }}
                            />
                        </View>

                        <View className="flex-row items-end gap-2 py-2">
                            <View className="flex-1 flex-row gap-2 px-1 bg-background-secondary items-end rounded-lg min-h-12">
                                <View className="flex-1">
                                    <TextInput
                                        className="bg-transparent text-foreground text-base"
                                        style={{
                                            height: textAreaHeight,
                                            textAlignVertical: 'top',
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            lineHeight: 21.5
                                        }}
                                        value={messageText}
                                        onChangeText={setMessageText}
                                        onContentSizeChange={handleContentSizeChange}
                                        placeholder="Type a message..."
                                        placeholderTextColor="#9CA3AF"
                                        multiline={true}
                                        scrollEnabled={false}
                                        onSubmitEditing={handleSendMessage}
                                        blurOnSubmit={false}
                                    />
                                </View>
                                <View className="flex-row items-center min-h-12">
                                    <Pressable className="px-1">
                                        <Image source={require('@/assets/images/icons/image.png')} style={{ width: 20, height: 20 }} />
                                    </Pressable>
                                    <Pressable className="px-1">
                                        <Image source={require('@/assets/images/icons/smile.png')} style={{ width: 20, height: 20 }} />
                                    </Pressable>
                                </View>
                            </View>
                            <Pressable
                                className="h-12 w-12 items-center justify-center"
                                onPress={handleSendMessage}
                            >
                                <Icon as={Send} size={20} />
                            </Pressable>
                        </View>

                        <Animated.View style={fakeView} />
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
