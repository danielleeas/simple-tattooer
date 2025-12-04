import { useState, useRef } from "react";
import { View, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import ClientHeader from '@/components/lib/client-header';
import BACK_IMAGE from '@/assets/images/icons/arrow_left.png';
import FAQPage from "./faq";
import AftercarePage from "./aftercare";

const { width } = Dimensions.get('window');

export default function FAQAftercarePage() {
    const [currentTab, setCurrentTab] = useState<'faqs' | 'aftercare'>('faqs');
    const slideAnim = useRef(new Animated.Value(0)).current;

    const handleBack = () => {
        router.back();
    };

    const handleTabChange = (tab: 'faqs' | 'aftercare') => {
        if (tab === currentTab) return;

        const tabIndex = {
            faqs: 0,
            aftercare: 1
        };

        const toValue = tab === 'faqs' ? 0 : -width;

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
                                variant={currentTab === 'faqs' ? 'default' : 'outline'}
                                className="flex-1"
                                onPress={() => handleTabChange('faqs')}
                            >
                                <Text>FAQs</Text>
                            </Button>
                            <Button
                                variant={currentTab === 'aftercare' ? 'default' : 'outline'}
                                className="flex-1"
                                onPress={() => handleTabChange('aftercare')}
                            >
                                <Text>Aftercare</Text>
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
                                <View style={{ width }} className="flex-1">
                                    <FAQPage />
                                </View>

                                {/* Aftercare Content */}
                                <View style={{ width }} className="flex-1">
                                    <AftercarePage />
                                </View>
                            </Animated.View>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
