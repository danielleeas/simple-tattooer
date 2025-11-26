import { useState, useRef } from "react";
import { View, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { router, Stack } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

import FAQPage from "./portfolios";
import AftercarePage from "./flashs";

const { width } = Dimensions.get('window');

export default function PortFolioFlashPage() {
    const [currentTab, setCurrentTab] = useState<'portfolios' | 'flashs'>('portfolios');
    const slideAnim = useRef(new Animated.Value(0)).current;

    const handleBack = () => {
        router.back();
    }

    const handleHome = () => {
        router.dismissAll();
    };

    const handleMenu = () => {
        router.push('/artist/menu');
    }

    const handleTabChange = (tab: 'portfolios' | 'flashs') => {
        if (tab === currentTab) return;

        const toValue = tab === 'portfolios' ? 0 : -width;

        Animated.timing(slideAnim, {
            toValue,
            duration: 300,
            useNativeDriver: true,
        }).start();

        setCurrentTab(tab);
    }

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
                    <View className="flex-1 pt-2 gap-6">
                        <View className="flex-row gap-6 px-4">
                            <Button variant={currentTab === 'portfolios' ? 'default' : 'outline'} className="flex-1" onPress={() => handleTabChange('portfolios')}>
                                <Text>Portfolio</Text>
                            </Button>
                            <Button variant={currentTab === 'flashs' ? 'default' : 'outline'} className="flex-1" onPress={() => handleTabChange('flashs')}>
                                <Text>Flash</Text>
                            </Button>
                        </View>
                        <View className="flex-1 overflow-hidden">
                            <Animated.View
                                style={{
                                    flexDirection: 'row',
                                    width: width * 2,
                                    transform: [{ translateX: slideAnim }]
                                }}
                                className="flex-1"
                            >
                                {/* FAQ Content */}
                                <FAQPage />

                                {/* Aftercare Content */}
                                <AftercarePage />
                            </Animated.View>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}