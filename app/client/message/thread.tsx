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
import { MessageBubble } from "@/components/MessageBubble";
import { michaelJoshMessages } from "@/lib/mocks";
import { Message } from "@/lib/types";

import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { useKeyboardHandler } from "react-native-keyboard-controller";

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
