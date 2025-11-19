import { View, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

export default function ResentDrawings() {

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
                                    <View className="items-center justify-center h-[120px]">
                                        <Image
                                            source={require('@/assets/images/icons/love_thin.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">recent</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Clients</Text>
                                    </View>

                                    <View className="gap-6">
                                        <View className="flex-1 items-center justify-center">
                                            <Text>No recent clients found</Text>
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
