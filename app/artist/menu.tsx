import { View, Image, type ImageStyle, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import CALENDAR_IMAGE from "@/assets/images/icons/calendar.png";
import QUESTION_IMAGE from "@/assets/images/icons/question.png";
import PLUS_IMAGE from "@/assets/images/icons/plus.png";
import RULE_IMAGE from "@/assets/images/icons/rules.png";
import DRAWINGS_IMAGE from "@/assets/images/icons/drawings.png";
import GEAR_IMAGE from "@/assets/images/icons/gear.png";
import FLASH_IMAGE from "@/assets/images/icons/flash.png";
import SMILE_IMAGE from "@/assets/images/icons/smile.png";
import IMPORT_CLIENT_IMAGE from "@/assets/images/icons/import_clients.png";


const ICON_STYLE: ImageStyle = {
    height: 56,
    width: 56,
}

export default function Menu() {

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    };

    const handleImportClients = () => {
        // router.push('/preview/clients/import-clients');
    };


    const handleNewAppointment = () => {
        // router.push('/preview/booking/search');
    };

    const handleManualAppointment = () => {
        router.push('/artist/booking/search');
    };

    const handleFAQ = () => {
        router.push('/artist/faq-aftercare');
    };

    const handleCalendar = () => {
        router.push('/artist/calendar');
    };

    const handleDrawings = () => {
        // router.push('/preview/drawings');
    };

    const handlePortfolios = () => {
        router.push('/artist/portfolios');
    };

    const handleCancellations = () => {
        // router.push('/preview/cancellation');
    };

    const handleClientView = () => {
        // router.push('/production/clients/view');
    };

    const handleSettings = () => {
        router.push('/artist/settings');
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header leftButtonImage={HOME_IMAGE} leftButtonTitle="Today" onLeftButtonPress={handleHome} />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4 pt-2 pb-4 gap-6">
                        <View>
                            <Text variant="h3" className="text-center">You can go anywhere</Text>
                            <Text variant="h3" className="text-center">from here...</Text>
                        </View>
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6 pb-6">
                                    <View className="flex-row gap-3 items-start justify-between">
                                        <View className="flex-1">
                                            <Pressable onPress={handleNewAppointment} className='items-center justify-center gap-1'>
                                                <Image source={PLUS_IMAGE} style={ICON_STYLE} />
                                                <View className="items-center">
                                                    <Text variant="h6" className='uppercase'>new</Text>
                                                    <Text variant="h6" className='uppercase leading-none'>appointment</Text>
                                                </View>
                                            </Pressable>
                                        </View>
                                        <View className="flex-1">
                                            <Pressable onPress={handleManualAppointment} className='items-center justify-center gap-1'>
                                                <Image source={PLUS_IMAGE} style={ICON_STYLE} />
                                                <View className="items-center">
                                                    <Text variant="h6" className='uppercase'>Manual</Text>
                                                    <Text variant="h6" className='uppercase leading-none'>appointment</Text>
                                                </View>
                                            </Pressable>
                                        </View>
                                    </View>

                                    <View className="flex-row gap-3 items-start justify-between">
                                        <View className="flex-1">
                                            <Pressable onPress={handleSettings} className='items-center justify-center gap-1'>
                                                <Image source={GEAR_IMAGE} style={ICON_STYLE} />
                                                <Text variant="h6" className='uppercase leading-none'>settings</Text>
                                            </Pressable>
                                        </View>
                                        <View className="flex-1">
                                            <Pressable onPress={handleCalendar} className='items-center justify-center gap-1'>
                                                <Image source={CALENDAR_IMAGE} style={ICON_STYLE} />
                                                <Text variant="h6" className='uppercase leading-none'>calendar</Text>
                                            </Pressable>
                                        </View>
                                    </View>

                                    <View className="flex-row gap-3 items-start justify-between">
                                        <View className="flex-1">
                                            <Pressable onPress={handleFAQ} className='items-center justify-center gap-1'>
                                                <Image source={QUESTION_IMAGE} style={ICON_STYLE} />
                                                <View className="items-center">
                                                    <Text variant="h6" className='uppercase'>FAQS/</Text>
                                                    <Text variant="h6" className='uppercase leading-none'>Aftercare</Text>
                                                </View>
                                            </Pressable>
                                        </View>
                                        <View className="flex-1">
                                            <Pressable onPress={handlePortfolios} className='items-center justify-center gap-1'>
                                                <Image source={FLASH_IMAGE} style={ICON_STYLE} />
                                                <View className="items-center">
                                                    <Text variant="h6" className='uppercase'>portfolio &</Text>
                                                    <Text variant="h6" className='uppercase leading-none'>flash upload</Text>
                                                </View>
                                            </Pressable>
                                        </View>
                                    </View>

                                    <View className="flex-row gap-3 items-start justify-between">
                                        <View className="flex-1">
                                            <Pressable onPress={handleCancellations} className='items-center justify-center gap-1'>
                                                <Image source={RULE_IMAGE} style={ICON_STYLE} />
                                                <View className="items-center">
                                                    <Text variant="h6" className='uppercase'>cancellation</Text>
                                                    <Text variant="h6" className='uppercase leading-none'>list</Text>
                                                </View>
                                            </Pressable>
                                        </View>
                                        <View className="flex-1">
                                            <Pressable onPress={handleDrawings} className='items-center justify-center gap-1'>
                                                <Image source={DRAWINGS_IMAGE} style={ICON_STYLE} />
                                                <Text variant="h6" className='uppercase'>drawings</Text>
                                            </Pressable>
                                        </View>
                                    </View>

                                    <View className="flex-row gap-3 items-start justify-between">
                                        <View className="flex-1">
                                            <Pressable onPress={handleClientView} className='items-center justify-center gap-1'>
                                                <Image source={SMILE_IMAGE} style={ICON_STYLE} />
                                                <Text variant="h6" className='uppercase leading-none'>client view</Text>
                                            </Pressable>
                                        </View>
                                        <View className="flex-1">
                                            <Pressable onPress={handleImportClients} className='items-center justify-center gap-1'>
                                                <Image source={IMPORT_CLIENT_IMAGE} style={ICON_STYLE} />
                                                <Text variant="h6" className='uppercase leading-none'>import clients</Text>
                                            </Pressable>
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