import { View, Image, Pressable } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import { router, Stack } from "expo-router";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setShowPurchase } from "@/lib/redux/slices/ui-slice";
import SubscribeModal from '@/components/lib/subscribe-modal';

export default function ImportClients() {
    const dispatch = useAppDispatch();
    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/preview/menu');
    };

    const handleImportOneByOne = () => {
        dispatch(setShowPurchase(true))
    };

    const handleImportList = () => {
        dispatch(setShowPurchase(true))
    };

    const handleExportAllClients = () => {
        dispatch(setShowPurchase(true))
    };

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
                    <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                        <View className="flex-1">
                            <View className="gap-1 mt-2">
                                <Text variant="h2" className="text-center">Import Clients</Text>
                                <Text variant="h5" className="text-center">Everyone at your fingertips...</Text>
                            </View>
                            <View className="flex-1 items-center justify-center gap-9">
                                <Pressable onPress={handleImportList} className="items-center justify-center gap-2">
                                    <Image source={require('@/assets/images/icons/import_clients.png')} style={{ width: 80, height: 80 }} />
                                    <View>
                                        <Text className="text-center text-text-secondary">Upload a CSV or Excel file to</Text>
                                        <Text className="text-center text-text-secondary">import your client list.</Text>
                                    </View>
                                </Pressable>
                                <Text variant="h4" className="text-center">or</Text>
                                <Pressable onPress={handleImportOneByOne} className="items-center justify-center">
                                    <Image source={require('@/assets/images/icons/plus.png')} style={{ width: 80, height: 80 }} />
                                    <View>
                                        <Text className="text-center text-text-secondary">Enter your clients’ details</Text>
                                        <Text className="text-center text-text-secondary">one by one.</Text>
                                    </View>
                                </Pressable>
                            </View>
                            <View className="gap-2 items-center">
                                <Button variant='outline' className="w-full" onPress={handleExportAllClients}>
                                    <Text>Export  All  Clients</Text>
                                    <Image source={require('@/assets/images/icons/export.png')} style={{ width: 24, height: 24 }} />
                                </Button>
                                <Text className="text-text-secondary text-sm">Export all your clients with one click.</Text>
                            </View>
                        </View>
                    </View>
                </StableGestureWrapper>
                <SubscribeModal />
            </SafeAreaView>
        </>
    );
}
