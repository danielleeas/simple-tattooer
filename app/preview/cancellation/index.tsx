import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Note } from "@/components/ui/note"
import { Icon } from "@/components/ui/icon";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import { View, Image, Pressable, ScrollView, Animated, TextInput } from "react-native";
import { Search, SearchIcon } from "lucide-react-native";
import { useState, useRef } from "react";

export default function Cancellations() {
    const [isStickyVisible, setIsStickyVisible] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;
    const stickyThreshold = 200; // Adjust this value based on when you want the sticky header to appear

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/preview/menu');
    };

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: false,
            listener: (event: any) => {
                const offsetY = event.nativeEvent.contentOffset.y;
                setIsStickyVisible(offsetY > stickyThreshold);
            }
        }
    );

    const handleDetailWaitlist = () => {
        router.push('/preview/cancellation/detail-waitlist');
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
                    <View className="flex-1 pt-2 pb-4 px-4 gap-6">
                        {/* Sticky Search and Filter Header */}
                        {isStickyVisible && (
                            <Animated.View
                                className="absolute top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 py-2"
                                style={{
                                    transform: [{
                                        translateY: scrollY.interpolate({
                                            inputRange: [stickyThreshold, stickyThreshold + 1],
                                            outputRange: [-60, 0],
                                            extrapolate: 'clamp',
                                        })
                                    }]
                                }}
                            >
                                <View className="flex-row items-center rounded-lg bg-background-secondary border border-border pl-3 h-10">
                                    <Icon as={SearchIcon} size={16} className="text-text-secondary mr-3" />
                                    <TextInput
                                        placeholder="Search"
                                        placeholderTextColor="#9CA3AF"
                                        className="flex-1 text-foreground text-small"
                                    />
                                </View>
                            </Animated.View>
                        )}

                        <View className="flex-1">
                            <ScrollView
                                contentContainerClassName="w-full"
                                showsVerticalScrollIndicator={false}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                            >
                                <View className="gap-6 pb-4">
                                    <View className="items-center justify-center" style={{ height: 180 }}>
                                        <Image
                                            source={require('@/assets/images/icons/rules.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">cancellation</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">list</Text>
                                        <Text className="text-center mt-2 text-text-secondary max-w-80">View and manage your cancellation list.</Text>
                                    </View>
                                    <View className="flex-row items-center rounded-lg bg-background-secondary border border-border pl-3 h-10">
                                        <Icon as={SearchIcon} size={16} className="text-text-secondary mr-3" />
                                        <TextInput
                                            placeholder="Search"
                                            placeholderTextColor="#9CA3AF"
                                            className="flex-1 text-foreground text-small"
                                        />
                                    </View>
                                    <Note
                                        message="This list is emailed automatically based on your settings. If you want to assign spots manually, you can toggle off in Settings."
                                    />
                                    <View className="flex-row gap-2 items-center">
                                        <View className="flex-1">
                                            <Text>Select Date</Text>
                                        </View>
                                        <View className="flex-row gap-2">
                                            <Pressable className="border border-border-white rounded-full px-4 py-1">
                                                <Text className="text-text-secondary text-xs">Aug 2, 2025</Text>
                                            </Pressable>
                                            <Pressable className="border border-border-white rounded-full px-4 py-1">
                                                <Text className="text-text-secondary text-xs">Oct 8, 2025</Text>
                                            </Pressable>
                                        </View>
                                    </View>

                                    <View className="flex-1 items-center justify-center">
                                        <Text>No cancellations found</Text>
                                    </View>
                                </View>

                            </ScrollView>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}