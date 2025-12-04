import { useState, useRef } from "react";
import { View, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import ClientHeader from '@/components/lib/client-header';
import BACK_IMAGE from '@/assets/images/icons/arrow_left.png';
import PortfolioPage from "./portfolios";
import FlashPage from "./flashs";

const { width } = Dimensions.get('window');

export default function FlashPortfolioPage() {
    const [currentTab, setCurrentTab] = useState<'portfolios' | 'flashs'>('flashs');
    const slideAnim = useRef(new Animated.Value(0)).current;

    const handleBack = () => {
        router.back();
    };

    const handleTabChange = (tab: 'portfolios' | 'flashs') => {
        if (tab === currentTab) return;

        const toValue = tab === 'flashs' ? 0 : -width;

        Animated.timing(slideAnim, {
            toValue,
            duration: 300,
            useNativeDriver: true,
        }).start();

        setCurrentTab(tab);
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className="flex-1 bg-background">
                <ClientHeader
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                />
                <StableGestureWrapper onSwipeRight={handleBack} threshold={80} enabled={true}>
                    <View className="flex-1 pt-2 gap-6">
                        <View className="flex-row gap-6 px-4">
                            <Button
                                variant={currentTab === 'flashs' ? 'default' : 'outline'}
                                className="flex-1"
                                onPress={() => handleTabChange('flashs')}
                            >
                                <Text>Flash</Text>
                            </Button>
                            <Button
                                variant={currentTab === 'portfolios' ? 'default' : 'outline'}
                                className="flex-1"
                                onPress={() => handleTabChange('portfolios')}
                            >
                                <Text>Portfolio</Text>
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
                                {/* Flash Content */}
                                <View style={{ width }} className="flex-1">
                                    <FlashPage />
                                </View>

                                {/* Portfolio Content */}
                                <View style={{ width }} className="flex-1">
                                    <PortfolioPage />
                                </View>
                            </Animated.View>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
