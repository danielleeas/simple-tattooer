import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/lib/Header";
import { View, Image, Pressable } from "react-native";
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

export default function MakeItYours() {
    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    };

    const handleMenu = () => {
        // router.push('/production/menu');
    };

    const handleYourRules = () => {
        router.push('/artist/settings/rule');
    };

    const handlleYourFlow = () => {
        router.push('/artist/settings/flow');
    }

    const handleYourApp = () => {
        router.push('/artist/settings/app');
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
                    <View className="flex-1 pt-2 pb-4 gap-6 items-center justify-center">
                        <View />
                        <View className="flex-1 max-w-[500px]">
                            <View className="flex-1 bg-background pt-2 pb-8 gap-7 justify-center">
                                <View className="w-full justify-center items-center">
                                    <Pressable style={{ maxWidth: 180 }} className="justify-center items-center gap-2" onPress={handleYourRules}>
                                        <Image
                                            source={require('@/assets/images/icons/rules.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase leading-6">Your rules</Text>
                                        <Text variant="small" className="text-center text-text-secondary leading-4">Set policies, payments, and emails - your way</Text>
                                    </Pressable>
                                </View>
                                <View className="w-full justify-center items-center">
                                    <Text variant="h1">Make It Yours</Text>
                                </View>
                                <View className="flex-row justify-between w-full" style={{ paddingHorizontal: 10 }}>
                                    <View className="flex-1 items-center justify-center">
                                        <Pressable onPress={handlleYourFlow} style={{ maxWidth: 180 }} className="justify-center items-center gap-2">
                                            <Image
                                                source={require('@/assets/images/icons/your_flow.png')}
                                                style={{ width: 56, height: 56 }}
                                                resizeMode="contain"
                                            />
                                            <Text variant="h6" className="text-center uppercase leading-6">Your flow</Text>
                                            <Text variant="small" className="text-center text-text-secondary leading-4">Adjust bookings, drawings, and cancellations.</Text>
                                        </Pressable>
                                    </View>
                                    <View className="flex-1 items-center justify-center">
                                        <Pressable style={{ maxWidth: 180 }} className="justify-center items-center gap-2" onPress={handleYourApp}>
                                            <Image
                                                source={require('@/assets/images/icons/your_app.png')}
                                                style={{ width: 56, height: 56 }}
                                                resizeMode="contain"
                                            />
                                            <Text variant="h6" className="text-center uppercase leading-6">Your app</Text>
                                            <Text variant="small" className="text-center text-text-secondary leading-4">Make it look, feel, and work how you like.</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View className="bg-background pt-2 pb-8 gap-4 justify-center items-center">
                            <Pressable style={{ height: 34, width: 160 }} className="justify-center items-center rounded-full border border-border-white">
                                <Text variant="small">Need Help? DM us!</Text>
                            </Pressable>
                            <View className="flex-row gap-1">
                                <Text variant="small">Read</Text>
                                <Pressable>
                                    <Text variant="small" className="underline">Privacy Policy</Text>
                                </Pressable>
                                <Text variant="small">and</Text>
                                <Pressable>
                                    <Text variant="small" className="underline">Terms and Conditions</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}