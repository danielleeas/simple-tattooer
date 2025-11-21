import { Pressable, View, Image } from "react-native";
import { Text } from "@/components/ui/text";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

export default function Alert() {
    const router = useRouter();


    const handleBack = () => {
        router.back();
    }

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/preview/menu');
    }

    const handleRequests = () => {
        router.push('/preview/alert/requests');
    }

    const handleConsults = () => {
        router.push('/preview/alert/consults');
    }

    const handleDrawingChanges = () => {
        router.push('/preview/alert/drawing-changes');
    }

    const handleMessages = () => {
        router.push('/preview/messages');
    }

    const handleCancelReschedule = () => {
        router.push('/preview/alert/cancel-reschedule');
    }

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
                    <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6 justify-center">
                        <View className="gap-[80px]">
                            <View className="w-full items-center justify-between flex-row">
                                <View className='h-full items-center w-[120px]' >
                                    <Pressable className='items-center justify-end' onPress={handleRequests}>
                                        <Image source={require('@/assets/images/icons/chat.png')} style={{ width: 56, height: 56 }} />
                                        <Text variant="h6" className='uppercase'>new</Text>
                                        <Text variant="h6" className='uppercase leading-none'>requests</Text>
                                    </Pressable>
                                </View>
                                <View className='h-full items-center w-[120px]' >
                                    <Pressable onPress={handleConsults} className='items-center justify-end' >
                                        <Image source={require('@/assets/images/icons/consult.png')} style={{ width: 56, height: 56 }} />
                                        <Text variant="h6" className='uppercase'>new</Text>
                                        <Text variant="h6" className='uppercase leading-none'>consult</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View className="gw-full items-center justify-between">
                                <Text variant="h1" className=''>Alerts</Text>
                                <Text variant="h5" className=''>Stay On Top Of Your Day</Text>
                            </View>
                            <View className="gap-4">
                                <View className="w-full items-center justify-between flex-row">
                                    <View className='h-full items-center w-[120px]' >
                                        <Pressable className='items-center justify-end' onPress={handleDrawingChanges}>
                                            <Image source={require('@/assets/images/icons/drawing_changes.png')} style={{ width: 56, height: 56 }} />
                                            <Text variant="h6" className='uppercase'>drawing</Text>
                                            <Text variant="h6" className='uppercase leading-none'>changes</Text>
                                        </Pressable>
                                    </View>
                                    <View className='h-full items-center w-[120px]' >
                                        <Pressable className='items-center justify-end' onPress={handleMessages}>
                                            <Image source={require('@/assets/images/icons/message.png')} style={{ width: 56, height: 56 }} />
                                            <Text variant="h6" className='uppercase'>new</Text>
                                            <Text variant="h6" className='uppercase leading-none'>messages</Text>
                                        </Pressable>
                                    </View>
                                </View>
                                <View className="w-full items-center justify-center flex-row">
                                    <View className='h-full items-center' >
                                        <Pressable className='items-center justify-end' onPress={handleCancelReschedule}>
                                            <Image source={require('@/assets/images/icons/not_smile.png')} style={{ width: 56, height: 56 }} />
                                            <Text variant="h6" className='uppercase'>Cancellation</Text>
                                            <Text variant="h6" className='uppercase leading-none'>Reschedule</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}