import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/lib/Header";
import { View, Image, Pressable, Modal } from "react-native";
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { X } from "lucide-react-native";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { setShowPurchase } from "@/lib/redux/slices/ui-slice";
import { useAppDispatch } from "@/lib/redux/hooks";
import SubscribeModal from "@/components/lib/subscribe-modal";

export default function MakeItYours() {

    const dispatch = useAppDispatch();
    const [privacyPolicyModalOpen, setPrivacyPolicyModalOpen] = useState(false);
    const [termsAndConditionsModalOpen, setTermsAndConditionsModalOpen] = useState(false);
    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/preview/menu');
    };

    const handleYourRules = () => {
        dispatch(setShowPurchase(true));
    };

    const handlleYourFlow = () => {
        dispatch(setShowPurchase(true));
    }

    const handleYourApp = () => {
        dispatch(setShowPurchase(true));
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
                        <View />
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
                            <View className="flex-row justify-between" style={{ paddingHorizontal: 10 }}>
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
                        <View className="bg-background pt-2 pb-8 gap-4 justify-center items-center">
                            <Pressable style={{ height: 34, width: 160 }} className="justify-center items-center rounded-full border border-border-white">
                                <Text variant="small">Need Help? DM us!</Text>
                            </Pressable>
                            <View className="flex-row gap-1">
                                <Text variant="small">Read</Text>
                                <Pressable onPress={() => setPrivacyPolicyModalOpen(true)}>
                                    <Text variant="small" className="underline">Privacy Policy</Text>
                                </Pressable>
                                <Text variant="small">and</Text>
                                <Pressable onPress={() => setTermsAndConditionsModalOpen(true)}>
                                    <Text variant="small" className="underline">Privacy Policy</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                    <Modal
                        visible={privacyPolicyModalOpen}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setPrivacyPolicyModalOpen(false)}
                    >
                        <View className="flex-1 bg-black/50 justify-end items-center pt-8">
                            <View className="relative w-full h-full bg-background-secondary rounded-t-3xl p-4 gap-6">
                                <Pressable className="z-10 absolute top-6 right-6" onPress={() => setPrivacyPolicyModalOpen(false)}>
                                    <Icon as={X} size={28} />
                                </Pressable>
                                <View className="gap-4">
                                    <Text variant="h4">Privacy Policy</Text>
                                    <Text>Effective Date: August 21, 2025</Text>
                                    <Text className="tracking-tight">
                                        This app collects only the information needed for you to create an account, book appointments, and manage your details.
                                    </Text>
                                    <View>
                                        <View className="flex-row items-start gap-2">
                                            <View className="w-1.5 h-1.5 mt-2 me-2 rounded-full bg-primary" />
                                            <Text className="flex-1">What we collect: Name, contact info, appointment details, and basic device data for app functionality.</Text>
                                        </View>
                                        <View className="flex-row items-start gap-2">
                                            <View className="w-1.5 h-1.5 mt-2 me-2 rounded-full bg-primary" />
                                            <Text className="flex-1">How it’s used: To let you book, view, and manage appointments inside the app.</Text>
                                        </View>
                                        <View className="flex-row items-start gap-2">
                                            <View className="w-1.5 h-1.5 mt-2 me-2 rounded-full bg-primary" />
                                            <Text className="flex-1">What we don’t do: We do not sell or share your information with third parties except if required by law.</Text>
                                        </View>
                                        <View className="flex-row items-start gap-2">
                                            <View className="w-1.5 h-1.5 mt-2 me-2 rounded-full bg-primary" />
                                            <Text className="flex-1">Managing your info: You can view or update your details anytime in the app.</Text>
                                        </View>
                                        <View className="flex-row items-start gap-2">
                                            <View className="w-1.5 h-1.5 mt-2 me-2 rounded-full bg-primary" />
                                            <Text className="flex-1">Security: We use industry-standard measures to keep your data safe.</Text>
                                        </View>
                                    </View>
                                    <Text className="tracking-tight">
                                        Any changes to this policy will be posted here with a new effective date.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    <Modal
                        visible={termsAndConditionsModalOpen}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setTermsAndConditionsModalOpen(false)}
                    >
                        <View className="flex-1 bg-black/50 justify-end items-center pt-8">
                            <View className="relative w-full h-full bg-background-secondary rounded-t-3xl p-4 gap-6">
                                <Pressable className="z-10 absolute top-6 right-6" onPress={() => setTermsAndConditionsModalOpen(false)}>
                                    <Icon as={X} size={28} />
                                </Pressable>
                                <View className="gap-4">
                                    <Text variant="h4">Terms and Conditions</Text>
                                    <Text>By using this app, you agree to:</Text>
                                    <View>
                                        <View className="flex-row items-start gap-2">
                                            <Text>1. </Text>
                                            <Text className="flex-1">How it’s used: To let you book, view, and manage appointments inside the app.</Text>
                                        </View>
                                        <View className="flex-row items-start gap-2">
                                            <Text>2. </Text>
                                            <Text className="flex-1">Provide accurate information for your account and bookings.</Text>
                                        </View>
                                        <View className="flex-row items-start gap-2">
                                            <Text>3. </Text>
                                            <Text className="flex-1">Understand that individual artists may set their own rules for payments, cancellations, and scheduling.</Text>
                                        </View>
                                    </View>
                                    <Text className="tracking-tight">
                                        Continued use of the app means you accept any updated terms shown here.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </StableGestureWrapper>

                <SubscribeModal />
            </SafeAreaView>
        </>
    );
}