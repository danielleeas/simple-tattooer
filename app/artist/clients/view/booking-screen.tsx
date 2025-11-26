import { Pressable, View, Image, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Stack, router } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { useAuth } from "@/lib/contexts";

const { height: screenHeight } = Dimensions.get('window');

export default function BookingScreen() {
    const { artist } = useAuth();
    const handleBack = () => {
        router.back();
    }

    const handleNext = () => {
        router.push('/artist/clients/view/start');
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    onSwipeLeft={handleNext}
                    threshold={80}
                    enabled={true}
                >
                    <View
                        className="flex-1 bg-background px-4 gap-6 justify-center"
                        style={{ paddingVertical: screenHeight * 0.08 }}
                    >
                        <View className="justify-around flex-1">
                            <View className="items-center justify-center">
                                <Text variant="h2" className="text-center">{artist?.full_name}</Text>
                                <Text variant="h5">{artist?.social_handler ? `${artist?.social_handler}` : '@artist.instagram'}</Text>
                            </View>
                            <View className="w-full items-center justify-between flex-row">
                                <View className='h-full items-center w-[120px]' >
                                    <Pressable className='items-center justify-end'>
                                        <Image source={require('@/assets/images/icons/chat.png')} style={{ width: 56, height: 56 }} />
                                        <Text variant="h6" className='uppercase'>Booking</Text>
                                        <Text variant="h6" className='uppercase leading-none'>Form</Text>
                                    </Pressable>
                                </View>
                                <View className='h-full items-center w-[120px]' >
                                    <Pressable className='items-center justify-end' >
                                        <Image source={require('@/assets/images/icons/consult.png')} style={{ width: 56, height: 56 }} />
                                        <Text variant="h6" className='uppercase'>Book a</Text>
                                        <Text variant="h6" className='uppercase leading-none'>consult</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View className="gw-full items-center justify-between">
                                <Image
                                    source={artist?.avatar ? { uri: artist?.avatar } : artist?.photo ? { uri: artist?.photo } : require('@/assets/images/others/booking_avatar.png')}
                                    style={{ width: 200, height: 200, borderRadius: 100 }}
                                    resizeMode="cover"
                                />
                            </View>
                            <View className="gap-4">
                                <View className="w-full items-center justify-between flex-row">
                                    <View className='h-full items-center w-[120px]' >
                                        <Pressable className='items-center justify-end'>
                                            <Image source={require('@/assets/images/icons/flash.png')} style={{ width: 56, height: 56 }} />
                                            <Text variant="h6" className='uppercase'>View</Text>
                                            <Text variant="h6" className='uppercase leading-none'>Flash</Text>
                                        </Pressable>
                                    </View>
                                    <View className='h-full items-center w-[120px]' >
                                        <Pressable className='items-center justify-end'>
                                            <Image source={require('@/assets/images/icons/portfolio.png')} style={{ width: 56, height: 56 }} />
                                            <Text variant="h6" className='uppercase'>View</Text>
                                            <Text variant="h6" className='uppercase leading-none'>Portfolio</Text>
                                        </Pressable>
                                    </View>
                                </View>
                                <View className="w-full items-center justify-center flex-row">
                                    <View className='h-full items-center' >
                                        <Pressable className='items-center justify-end'>
                                            <Image source={require('@/assets/images/icons/question.png')} style={{ width: 56, height: 56 }} />
                                            <Text variant="h6" className='uppercase'>Faqs</Text>
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
