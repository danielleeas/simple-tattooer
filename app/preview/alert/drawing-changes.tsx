import { View, Image, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

export default function DrawingChanges() {
    const router = useRouter();

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
                                            source={require('@/assets/images/icons/drawing_changes.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Drawing</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Changes</Text>
                                        <Text className="text-center mt-2 text-text-secondary">Here's what needs your eye —</Text>
                                        <Text className="text-center text-text-secondary leading-none">adjust when you’re ready.</Text>
                                    </View>

                                    <View className="gap-6">
                                        
                                        {/* Remaining requests - two per row */}
                                        <View className="flex-1 items-center justify-center">
                                        <Text className="text-center max-w-[300px]">No Drawing Changes Right Now — You're All Caught Up!</Text>
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
