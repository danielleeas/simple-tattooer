import { useEffect } from "react";
import { router } from "expo-router";
import { Pressable, View, StyleSheet, useWindowDimensions, ImageStyle, Image } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Settings2, X } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setShowPurchase } from "@/lib/redux/slices/ui-slice";
import CustomModal from "@/components/lib/custom-modal";

import Info from '@/assets/images/icons/warning_circle.png';

const ICON_STYLE: ImageStyle = {
    height: 80,
    width: 80,
};

export default function SubscribeModal() {
    const dispatch = useAppDispatch();
    const showPurchase = useAppSelector((state) => state.ui.showPurchase);

    const handlePurchaseButton = () => {
        dispatch(setShowPurchase(true));
    }

    const handleSubscribePage = () => {
        router.push('/preview/subscribe?type=first');
        dispatch(setShowPurchase(false))
    }

    const handleSigninPage = () => {
        router.push('/auth/signin');
        dispatch(setShowPurchase(false))
    }

    return (
        <>
            <CustomModal
                visible={showPurchase}
                onClose={() => dispatch(setShowPurchase(false))}
                variant="bottom-sheet"
                showCloseButton={false}
                closeOnBackdrop={true}
                animationDuration={200}
                backdropOpacity={0.9}
                borderRadius={40}
                className="bg-background-secondary"
            >
                <View className="p-4 pt-4 pb-8 gap-2">
                    <View className="items-center justify-center">
                        <Image
                            source={Info}
                            style={ICON_STYLE}
                            resizeMode="contain"
                        />
                    </View>
                    <View>
                        <Text variant="h6" className="text-center">You are currently viewing Simple Tattooer in Preview Mode - tap outside this box to look around. Create an Account or Sign In to unlock full access</Text>
                    </View>
                    <View className="flex-row items-center justify-center gap-2">
                        <View className="flex-1">
                            <Button variant="outline" className="mt-4" onPress={handleSubscribePage}>
                                <Text className="uppercase">Subscribe</Text>
                            </Button>
                        </View>
                        <View className="flex-1">
                            <Button variant="outline" className="mt-4" onPress={handleSigninPage}>
                                <Text className="uppercase">Sign In</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </CustomModal>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 990,
        height: 40,
        width: 40,
        top: 10,
        right: 10,
    },
});