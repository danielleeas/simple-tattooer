import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/lib/Header";
import { View, ScrollView, Image, Pressable } from "react-native";
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

export default function ClientView() {
    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    };

    const handleMenu = () => {
        router.push('/preview/menu');
    };

    const handleWelcomeScreen = () => {
        router.push('/preview/clients/view/welcome-screen');
    };

    const handleBookingScreen = () => {
        router.push('/preview/clients/view/booking-screen');
    };

    const handleStartScreen = () => {
        router.push('/preview/clients/view/start');
    };

    const handleYourDatesScreen = () => {
        router.push('/preview/clients/view/your-dates');
    };

    const handleEmailExampleScreen = () => {
        router.push('/preview/clients/view/email-example');
    };

    const handleBookingFormScreen = () => {
        router.push('/preview/clients/view/booking-form');
    };

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
                    onSwipeLeft={handleWelcomeScreen}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 pt-2 pb-4 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-7">
                                    <View className="items-center justify-center" style={{ height: 180 }}>
                                        <Image
                                            source={require('@/assets/images/icons/smile.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">CLIENT VIEW</Text>
                                        <Text className="text-center mt-2 text-text-secondary">Tap below to see</Text>
                                        <Text className="text-center text-text-secondary leading-none">the client experience</Text>
                                    </View>
                                    <View className="gap-4 flex-row justify-around">
                                        <Pressable className="flex-1 gap-6 max-w-[180px]" onPress={handleWelcomeScreen}>
                                            <Text variant="h5">Your Welcome Screen</Text>
                                            <View className="w-full " style={{ height: 370 }}>
                                                <Image
                                                    source={require('@/assets/images/others/phone_header.png')}
                                                    style={{ width: '100%', height: 22 }}
                                                    resizeMode="cover"
                                                />
                                                <View className="flex-1 gap-1">
                                                    <View className="items-center justify-center">
                                                        <Text style={{ fontSize: 17, lineHeight: 22 }}>Artist Name</Text>
                                                        <Text style={{ fontSize: 9, lineHeight: 14 }}>@artist. instagram</Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <Image
                                                            source={require('@/assets/images/others/client_welcome.png')}
                                                            style={{ width: '100%', height: '100%' }}
                                                            resizeMode="contain"

                                                        />
                                                    </View>
                                                    <View className="items-end justify-center">
                                                        <Text style={{ fontSize: 15, lineHeight: 18 }}>Simple Tattooer.</Text>
                                                        <Text style={{ fontSize: 5, lineHeight: 8 }}>Helping tattoo artists just tattoo again. </Text>
                                                    </View>
                                                </View>
                                                <View className="items-center justify-center pt-2 pb-1">
                                                    <View style={{ width: 60, height: 2, backgroundColor: '#fff', borderRadius: 1 }} />
                                                </View>
                                            </View>
                                        </Pressable>
                                        <Pressable className="flex-1 gap-6 max-w-[180px]" onPress={handleBookingScreen}>
                                            <Text variant="h5">Your Personal Booking Link</Text>
                                            <View className="w-full " style={{ height: 370 }}>
                                                <Image
                                                    source={require('@/assets/images/others/phone_header.png')}
                                                    style={{ width: '100%', height: 22 }}
                                                    resizeMode="cover"
                                                />
                                                <View className="flex-1 py-4 justify-around">
                                                    <View className="items-center justify-center">
                                                        <Text style={{ fontSize: 17, lineHeight: 22 }}>Sarah Benjamin</Text>
                                                        <Text style={{ fontSize: 9, lineHeight: 14 }}>@artist. instagram</Text>
                                                    </View>
                                                    <View className="w-full items-center justify-between flex-row">
                                                        <View className='items-start flex-1' >
                                                            <Pressable className='items-center justify-end'>
                                                                <Image source={require('@/assets/images/icons/chat.png')} style={{ width: 26, height: 26 }} />
                                                                <Text className='uppercase' style={{ fontSize: 9, lineHeight: 14 }}>Booking</Text>
                                                                <Text className='uppercase leading-none' style={{ fontSize: 9 }}>Form</Text>
                                                            </Pressable>
                                                        </View>
                                                        <View className='items-end flex-1' >
                                                            <Pressable className='items-center justify-end' >
                                                                <Image source={require('@/assets/images/icons/consult.png')} style={{ width: 26, height: 26 }} />
                                                                <Text className='uppercase' style={{ fontSize: 9, lineHeight: 14 }}>Book a</Text>
                                                                <Text className='uppercase leading-none' style={{ fontSize: 9 }}>consult</Text>
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                    <View className="gw-full items-center justify-between">
                                                        <Image
                                                            source={require('@/assets/images/others/booking_avatar.png')}
                                                            style={{ width: 90, height: 90, borderRadius: 50 }}
                                                            resizeMode="cover"
                                                        />
                                                    </View>
                                                    <View className="w-full items-center justify-between flex-row">
                                                        <View className='items-start flex-1' >
                                                            <Pressable className='items-center justify-end'>
                                                                <Image source={require('@/assets/images/icons/flash.png')} style={{ width: 26, height: 26 }} />
                                                                <Text className='uppercase' style={{ fontSize: 9, lineHeight: 14 }}>Booking</Text>
                                                                <Text className='uppercase leading-none' style={{ fontSize: 9 }}>Form</Text>
                                                            </Pressable>
                                                        </View>
                                                        <View className='items-end flex-1' >
                                                            <Pressable className='items-center justify-end' >
                                                                <Image source={require('@/assets/images/icons/portfolio.png')} style={{ width: 26, height: 26 }} />
                                                                <Text className='uppercase' style={{ fontSize: 9, lineHeight: 14 }}>Book a</Text>
                                                                <Text className='uppercase leading-none' style={{ fontSize: 9 }}>consult</Text>
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                    <View className="w-full items-center justify-center flex-row">
                                                        <View className='items-center flex-1' >
                                                            <Pressable className='items-center justify-end'>
                                                                <Image source={require('@/assets/images/icons/question.png')} style={{ width: 26, height: 26 }} />
                                                                <Text className='uppercase' style={{ fontSize: 9, lineHeight: 14 }}>Faqs</Text>
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                </View>
                                                <View className="items-center justify-center pt-2 pb-1">
                                                    <View style={{ width: 60, height: 2, backgroundColor: '#fff', borderRadius: 1 }} />
                                                </View>
                                            </View>
                                        </Pressable>
                                    </View>
                                    <Pressable className="flex-1 gap-6" onPress={handleStartScreen}>
                                        <Text variant="h5" className="tracking-tight">Approved Client Dashboard: Start Here Stress Less</Text>
                                    </Pressable>
                                    <Pressable className="flex-1 gap-6" onPress={handleYourDatesScreen}>
                                        <Text variant="h5">Your Dates</Text>
                                    </Pressable>
                                    <Pressable className="flex-1 gap-6" onPress={handleEmailExampleScreen}>
                                        <Text variant="h5">Example of Branded Email</Text>
                                    </Pressable>
                                    <Pressable className="flex-1 gap-6" onPress={handleBookingFormScreen}>
                                        <Text variant="h5">Click Here To View Your Booking Form</Text>
                                    </Pressable>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}