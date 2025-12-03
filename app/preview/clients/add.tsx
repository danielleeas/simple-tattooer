import { View, Image } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";

import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SubscribeModal from '@/components/lib/subscribe-modal';

import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import PLUS_THIN_IMAGE from "@/assets/images/icons/plus_thin.png";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setShowPurchase } from "@/lib/redux/slices/ui-slice";

export default function AddClient() {
    const dispatch = useAppDispatch();
    
    const handleBack = () => {
        router.back();
    };

    const handleCreateClient = () => {
        dispatch(setShowPurchase(true))
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                <View className="flex-1 bg-background px-4 pt-2 pb-10 gap-6">
                    <View className="flex-1">
                        <KeyboardAwareScrollView bottomOffset={50} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                            <View className="gap-6 pb-10">
                                <View className="items-center justify-center pb-9">
                                    <Image
                                        source={PLUS_THIN_IMAGE}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Add</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">new Client</Text>
                                    <Text className="text-center text-text-secondary mt-[18px]">[Artist name] Booking Form</Text>
                                </View>
                                <View className="gap-2">
                                    <Text variant="h5">Full Name</Text>
                                    <Input placeholder="Enter full name" helperText="First and last, please" />
                                </View>
                                <View className="gap-2">
                                    <Text variant="h5">Email</Text>
                                    <Input placeholder="Enter email" />
                                </View>
                                <View className="gap-2">
                                    <Text variant="h5">Phone Number</Text>
                                    <Input placeholder="Enter phone number" />
                                </View>
                                <View className="gap-2">
                                    <Text variant="h5">Project Notes</Text>
                                    <Textarea placeholder="Enter project notes" className="min-h-28" />
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                    <View className="flex-row gap-3">
                        <View className="flex-1">
                            <Button variant="outline" size="lg" onPress={handleBack}>
                                <Text variant='h5'>Cancel</Text>
                            </Button>
                        </View>
                        <View className="flex-1">
                            <Button variant="outline" size="lg" onPress={handleCreateClient}>
                                <Text variant='h5' numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Create Quote</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
            <SubscribeModal />
        </>
    );
}