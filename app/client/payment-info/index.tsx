import { useState } from "react";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientHeader from "@/components/lib/client-header";
import { View, Image, ImageBackground, Pressable } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { useToast } from "@/lib/contexts/toast-context";
import { ChevronDown, ChevronUp } from "lucide-react-native";

export default function PaumentInfo() {
    const [leftArmSleeveColOpened, setLeftArmSleeveColOpened] = useState(false);
    const [rightArmSleeveColOpened, setRightArmSleeveColOpened] = useState(false);

    const dayRangesChunks = [
        [{ value: '2025-08-02', label: 'Aug 2, 2025' }, { value: '2025-10-08', label: 'Oct 8, 2025' }],
        [{ value: '2025-09-05', label: 'Sept 5, 2025' }]
    ]

    const handleBack = () => {
        router.back();
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <ClientHeader
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={100}
                    enabled={true}
                >
                    <View className="flex-1 pt-2 pb-4 gap-6">
                        <KeyboardAwareScrollView bottomOffset={50} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                            <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                                <View className="items-center justify-center" style={{ height: 180 }}>
                                    <Image
                                        source={require('@/assets/images/icons/payments.png')}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">payment</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">info</Text>
                                    <Text className="text-center mt-2 text-text-secondary">See exactly what you've paid and how — clear</Text>
                                    <Text className="text-center text-text-secondary leading-none">and simple</Text>
                                </View>

                                <View className="gap-6">
                                    <View className="gap-2">
                                        <Pressable className="flex-row items-center justify-between gap-2" onPress={() => setLeftArmSleeveColOpened(!leftArmSleeveColOpened)}>
                                            <View className="flex-row items-center gap-2">
                                                <View className="h-2 w-2 rounded-full bg-foreground"></View>
                                                <Text variant="h4" >Left Arm Sleeve</Text>
                                            </View>
                                            <Icon as={leftArmSleeveColOpened ? ChevronUp : ChevronDown} strokeWidth={1} size={32} />
                                        </Pressable>
                                        {leftArmSleeveColOpened && (
                                            <View className="gap-10">
                                                <View className="gap-4">
                                                    <View className="flex-row items-start justify-between gap-2">
                                                        <Image
                                                            source={require('@/assets/images/icons/deposit.png')}
                                                            style={{ width: 48, height: 48 }}
                                                            resizeMode="contain"
                                                        />
                                                        <View className="flex-1">
                                                            <Text variant="h4">Deposit</Text>
                                                            <Text className="text-text-secondary text-sm">Your deposit secures your spot</Text>
                                                        </View>
                                                    </View>
                                                    <View className="gap-2">
                                                        <Text className="text-text-secondary">Amount</Text>
                                                        <Text variant="h5">$1000</Text>
                                                    </View>
                                                    <View className="gap-2">
                                                        <Text className="text-text-secondary">Date Paid</Text>
                                                        <Text variant="h5">July 02, 2025 - 07:04 am</Text>
                                                    </View>
                                                </View>
                                                <View className="gap-4">
                                                    <View className="flex-row items-start justify-between gap-2">
                                                        <Image
                                                            source={require('@/assets/images/icons/billing.png')}
                                                            style={{ width: 48, height: 48 }}
                                                            resizeMode="contain"
                                                        />
                                                        <View className="flex-1">
                                                            <Text variant="h4">Session Rate</Text>
                                                            <Text className="text-text-secondary text-sm">Clear breakdown so there are no suprises</Text>
                                                        </View>
                                                    </View>
                                                    <View className="gap-2">
                                                        <Text className="text-text-secondary">Session Rate</Text>
                                                        <Text variant="h5">$2500</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    <View className="gap-2">
                                        <Pressable className="flex-row items-center justify-between gap-2" onPress={() => setRightArmSleeveColOpened(!rightArmSleeveColOpened)}>
                                            <View className="flex-row items-center gap-2">
                                                <View className="h-2 w-2 rounded-full bg-foreground"></View>
                                                <Text variant="h4" >Right Arm Sleeve</Text>
                                            </View>
                                            <Icon as={rightArmSleeveColOpened ? ChevronUp : ChevronDown} strokeWidth={1} size={32} />
                                        </Pressable>
                                        {rightArmSleeveColOpened && (
                                            <View className="gap-10">
                                                <View className="gap-4">
                                                    <View className="flex-row items-start justify-between gap-2">
                                                        <Image
                                                            source={require('@/assets/images/icons/deposit.png')}
                                                            style={{ width: 48, height: 48 }}
                                                            resizeMode="contain"
                                                        />
                                                        <View className="flex-1">
                                                            <Text variant="h4">Deposit</Text>
                                                            <Text className="text-text-secondary text-sm">Your deposit secures your spot</Text>
                                                        </View>
                                                    </View>
                                                    <View className="gap-2">
                                                        <Text className="text-text-secondary">Amount</Text>
                                                        <Text variant="h5">$1000</Text>
                                                    </View>
                                                    <View className="gap-2">
                                                        <Text className="text-text-secondary">Date Paid</Text>
                                                        <Text variant="h5">July 02, 2025 - 07:04 am</Text>
                                                    </View>
                                                </View>
                                                <View className="gap-4">
                                                    <View className="flex-row items-start justify-between gap-2">
                                                        <Image
                                                            source={require('@/assets/images/icons/billing.png')}
                                                            style={{ width: 48, height: 48 }}
                                                            resizeMode="contain"
                                                        />
                                                        <View className="flex-1">
                                                            <Text variant="h4">Session Rate</Text>
                                                            <Text className="text-text-secondary text-sm">Clear breakdown so there are no suprises</Text>
                                                        </View>
                                                    </View>
                                                    <View className="gap-2">
                                                        <Text className="text-text-secondary">Session Rate</Text>
                                                        <Text variant="h5">$2500</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}