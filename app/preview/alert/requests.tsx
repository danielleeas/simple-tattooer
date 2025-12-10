import { View, Image, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

export default function Requests() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    const handleMenu = () => {
        router.push('/preview/menu');
    };

    const handleHome = () => {
        router.dismissAll();
    }

    return (
        <>
            <Stack.Screen options={{headerShown: false, animation: 'slide_from_right'}} />
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
                                    <View className="items-center justify-center pb-[22px] h-[180px]">
                                        <Image
                                            source={require('@/assets/images/icons/chat.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">New</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">requests</Text>
                                        <Text className="text-center mt-2 text-text-secondary">Here’s who needs your</Text>
                                        <Text className="text-center text-text-secondary leading-none">attention today — no rush</Text>
                                    </View>

                                    <View className="gap-6">
                                        
                                        {/* Remaining requests - two per row */}
                                        <View className="flex-1 items-center justify-center">
                                        <Text className="text-center max-w-[300px]">No New Booking Requests Right Now — Enjoy The Quiet While It Lasts</Text>
                                        </View>
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
