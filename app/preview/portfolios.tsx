import { useState, useRef } from "react";
import { ScrollView, View, Animated, Dimensions, Image, Pressable, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from "react-native-safe-area-context";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { router, Stack } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import SubscribeModal from '@/components/lib/subscribe-modal';

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import { Plus } from "lucide-react-native";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setShowPurchase } from "@/lib/redux/slices/ui-slice";

const { width } = Dimensions.get('window');

export default function FAQAftercarePage() {
    const [currentTab, setCurrentTab] = useState<'faqs' | 'aftercare'>('faqs');
    const slideAnim = useRef(new Animated.Value(0)).current;
    const dispatch = useAppDispatch();

    const handleBack = () => {
        router.back();
    }

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/preview/menu');
    }

    const handleTabChange = (tab: 'faqs' | 'aftercare') => {
        if (tab === currentTab) return;

        const toValue = tab === 'faqs' ? 0 : -width;

        Animated.timing(slideAnim, {
            toValue,
            duration: 300,
            useNativeDriver: true,
        }).start();

        setCurrentTab(tab);
    }

    const handlePurchase = () => {
        dispatch(setShowPurchase(true))
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
                    <View className="flex-1 pt-2 pb-4 gap-6">
                        <View className="flex-row gap-6 px-4">
                            <Button variant={currentTab === 'faqs' ? 'default' : 'outline'} className="flex-1" onPress={() => handleTabChange('faqs')}>
                                <Text>Portfolio</Text>
                            </Button>
                            <Button variant={currentTab === 'aftercare' ? 'default' : 'outline'} className="flex-1" onPress={() => handleTabChange('aftercare')}>
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
                                <View style={{ width }} className="flex-1">
                                    <KeyboardAwareScrollView bottomOffset={20} contentContainerClassName="w-full px-4" showsVerticalScrollIndicator={false}>
                                        <View className="gap-6">
                                            <View className="items-center justify-center" style={{ height: 180 }}>
                                                <Image
                                                    source={require('@/assets/images/icons/portfolio.png')}
                                                    style={{ width: 56, height: 56 }}
                                                    resizeMode="contain"
                                                />
                                                <Text variant="h6" className="text-center uppercase">Portfolio</Text>
                                                <Text variant="h6" className="text-center uppercase leading-none">upload</Text>
                                                <Text className="text-center mt-2 text-text-secondary max-w-80">Show off your work — add titles if you like, keep it simple.</Text>
                                            </View>

                                            <View className="gap-10">
                                                <View className="items-center justify-center px-4 py-3">
                                                    <Text variant="h5" className="text-text-secondary">No Portfolio found</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </KeyboardAwareScrollView>
                                    <View className="gap-4 px-4 pt-4">
                                        <Button variant="outline" onPress={handlePurchase}>
                                            <Text>Upload Your Tattoos</Text>
                                            <Icon as={Plus} size={24} strokeWidth={1} />
                                        </Button>
                                    </View>
                                </View>

                                {/* Aftercare Content */}
                                <View style={{ width }} className="flex-1">
                                    <ScrollView contentContainerClassName="w-full px-4" showsVerticalScrollIndicator={false} >
                                        <View className="gap-6">
                                            <View className="items-center justify-center" style={{ height: 180 }}>
                                                <Image
                                                    source={require('@/assets/images/icons/flash.png')}
                                                    style={{ width: 56, height: 56 }}
                                                    resizeMode="contain"
                                                />
                                                <Text variant="h6" className="text-center uppercase">Flash</Text>
                                                <Text variant="h6" className="text-center uppercase leading-none">upload</Text>
                                                <Text className="text-center mt-2 text-text-secondary max-w-80">Add your ready-to-go designs below. Give them a name, price, and mark if they’re repeatable.</Text>
                                            </View>

                                            <View className="gap-6">
                                                <View className="items-center justify-center px-4 py-3">
                                                    <Text variant="h5" className="text-text-secondary">No Flash found</Text>
                                                </View>
                                            </View>

                                        </View>
                                    </ScrollView>
                                    <View className="gap-4 px-4 pt-4">
                                        <Button variant="outline" onPress={handlePurchase}>
                                            <Text>Upload New Flash</Text>
                                            <Icon as={Plus} size={24} strokeWidth={1} />
                                        </Button>
                                    </View>
                                </View>
                            </Animated.View>
                        </View>
                    </View>
                </StableGestureWrapper>
                <SubscribeModal />
            </SafeAreaView>
        </>
    );
}