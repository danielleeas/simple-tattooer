import { Pressable, View, Image, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Stack, router } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';

const { height: screenHeight } = Dimensions.get('window');

export default function StartScreen() {
    const handleBack = () => {
        router.back();
    }
    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View
                        className="flex-1 bg-background px-4 gap-6 justify-center"
                        style={{ paddingVertical: screenHeight * 0.08 }}
                    >
                        <View className="justify-around flex-1">
                            <View className="w-full items-center justify-center flex-row">
                                <View className='h-full items-center' >
                                    <Pressable className='items-center justify-end'>
                                        <Image source={require('@/assets/images/icons/message.png')} style={{ width: 56, height: 56 }} />
                                        <Text variant="h6" className='uppercase'>Messages</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View className="w-full items-center justify-between flex-row">
                                <View className='h-full items-center w-[140px]' >
                                    <Pressable className='items-center justify-end'>
                                        <Image source={require('@/assets/images/icons/money_bag.png')} style={{ width: 56, height: 56 }} />
                                        <Text variant="h6" className='uppercase'>Payment</Text>
                                        <Text variant="h6" className='uppercase leading-none'>Info</Text>
                                    </Pressable>
                                </View>
                                <View className='h-full items-center w-[140px]' >
                                    <Pressable className='items-center justify-end' >
                                        <Image source={require('@/assets/images/icons/calendar.png')} style={{ width: 56, height: 56 }} />
                                        <Text variant="h6" className='uppercase'>Your</Text>
                                        <Text variant="h6" className='uppercase leading-none'>Dates</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View className="gw-full items-center justify-between">
                                <Text variant="h1" className=''>Start Here.</Text>
                                <Text variant="h1" className='leading-none'>Stress Less.</Text>
                            </View>
                            <View className="gap-4">
                                <View className="w-full items-center justify-between flex-row">
                                    <View className='h-full items-center w-[140px]' >
                                        <Pressable className='items-center justify-end'>
                                            <Image source={require('@/assets/images/icons/portfolio.png')} style={{ width: 56, height: 56 }} />
                                            <Text variant="h6" className='uppercase'>flash/</Text>
                                            <Text variant="h6" className='uppercase leading-none'>portfolio</Text>
                                        </Pressable>
                                    </View>
                                    <View className='h-full items-center w-[140px]' >
                                        <Pressable className='items-center justify-end'>
                                            <Image source={require('@/assets/images/icons/how_to_find.png')} style={{ width: 56, height: 56 }} />
                                            <Text variant="h6" className='uppercase'>How to</Text>
                                            <Text variant="h6" className='uppercase leading-none'>find me</Text>
                                        </Pressable>
                                    </View>
                                </View>
                                <View className="w-full items-center justify-center flex-row">
                                    <View className='h-full items-center' >
                                        <Pressable className='items-center justify-end'>
                                            <Image source={require('@/assets/images/icons/question.png')} style={{ width: 56, height: 56 }} />
                                            <Text variant="h6" className='uppercase'>Faqs/</Text>
                                            <Text variant="h6" className='uppercase leading-none'>aftercare</Text>
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
