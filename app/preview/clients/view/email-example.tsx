import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/lib/Header";
import { View, ScrollView, Image, Pressable } from "react-native";
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";

export default function EmailExampleScreen() {
    const handleBack = () => {
        router.back();
    };


    const handleWelcomeScreen = () => {
        router.push('/preview/clients/view/welcome-screen');
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    onSwipeLeft={handleWelcomeScreen}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 pt-2 pb-4 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="flex-1 bg-background px-4">
                                    <View className="gap-10 px-4 py-10">
                                        <View className="gap-5 items-center justify-center">
                                            <Image
                                                source={require('@/assets/images/avatars/default.png')}
                                                style={{ width: 100, height: 100, borderRadius: 50 }}
                                                resizeMode="cover"
                                            />
                                            <View className="gap-2 items-center justify-center">
                                                <Text variant="h4">Booking Request Received</Text>
                                                <Text>with Andrew Thomson</Text>
                                            </View>
                                        </View>

                                        <View className="gap-4 items-start justify-start min-h-[200px]">
                                            <Text>Hi [Client First Name],</Text>
                                            <Text>Thanks for sending your idea my way! I’ll look it over and get back to you soon. While you wait, feel free to check out more of my work.</Text>
                                            <View>
                                                <Text>[Your Name]</Text>
                                                <Text>[Studio Name, if applicable]</Text>
                                            </View>
                                        </View>

                                        <View className="gap-4">
                                            <View className="gap-2">
                                                <Text className="text-xs">Download Our App</Text>
                                                <View className="w-full flex-row gap-2">
                                                    <Pressable>
                                                        <Image
                                                            source={require('@/assets/images/icons/android_store_btn.png')}
                                                            style={{ width: 100, height: 34 }}
                                                            resizeMode="contain"
                                                        />
                                                    </Pressable>
                                                    <Pressable>
                                                        <Image
                                                            source={require('@/assets/images/icons/apple_store_btn.png')}
                                                            style={{ width: 100, height: 34 }}
                                                            resizeMode="contain"
                                                        />
                                                    </Pressable>
                                                </View>
                                            </View>

                                            <View className="gap-2">
                                                <Text className="text-xs">Follow Us</Text>
                                                <View className="w-full flex-row gap-2">
                                                    <Pressable>
                                                        <Image
                                                            source={require('@/assets/images/icons/instagram.png')}
                                                            style={{ width: 24, height: 24 }}
                                                            resizeMode="contain"
                                                        />
                                                    </Pressable>
                                                </View>
                                            </View>

                                            <View className="w-full h-[1px] bg-border" />

                                            <Text className="text-xs">© 2025 Simple Tatooer. All Right Reserved</Text>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </StableGestureWrapper >
            </SafeAreaView >
        </>
    );
}