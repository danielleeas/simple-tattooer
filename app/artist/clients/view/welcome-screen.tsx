import { router, Stack } from "expo-router";
import { View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/contexts";

export default function WelcomeScreen() {
    const { artist } = useAuth();
    const handleBack = () => {
        router.back();
    };

    const handleNext = () => {
        router.push('/artist/clients/view/booking-screen');
    };

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
                    <View className="flex-1 bg-background pt-4 pb-2 gap-6">
                        <View className="items-center justify-center">
                            <Text variant="h2" className="text-center">{artist?.full_name}</Text>
                            <Text variant="h5">{artist?.social_handler ? `${artist?.social_handler}` : '@artist.instagram'}</Text>
                        </View>
                        <View className="flex-1">
                            <Image
                                source={artist?.photo ? { uri: artist?.photo } : require('@/assets/images/others/client_welcome.png')}
                                style={{ width: '100%', height: '100%'}}
                                resizeMode="contain"
                                />
                        </View>
                        <View className="items-end justify-center px-4 pb-4">
                            <Text variant="h3">Simple Tattooer.</Text>
                            <Text className="text-xs">Helping tattoo artists just tattoo again.</Text>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
