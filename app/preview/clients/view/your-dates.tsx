import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/lib/Header";
import { View, ScrollView, Image } from "react-native";
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { FileSearch, FileText } from "lucide-react-native";

export default function YourDatesScreen() {
    const handleBack = () => {
        router.back();
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 pt-2 pb-4 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-7">
                                    <View className="items-center justify-center" style={{ height: 180 }}>
                                        <Image
                                            source={require('@/assets/images/icons/calendar.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Your</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Dates</Text>
                                        <Text className="text-center mt-2 text-text-secondary">All your tattoo appointments in one place-easy</Text>
                                        <Text className="text-center text-text-secondary leading-none">to check, easy to change</Text>
                                    </View>
                                    <View className="gap-6">
                                        <View className="gap-2">
                                            <Text>Left Arm Sleeve — Session 1</Text>
                                            <View className="flex-row w-full justify-between">
                                                <View className="gap-1">
                                                    <Text className="text-text-secondary leading-none text-xs">Sat, July 5, 2025</Text>
                                                    <Text className="text-text-secondary leading-none text-xs">10:00 AM</Text>
                                                </View>
                                                <View className="w-[120px] gap-2">
                                                    <Image source={require('@/assets/images/tattoos/tattoos_17.png')} style={{ width: "100%", height: 60, borderRadius: 5 }} />
                                                    <Text className="text-text-secondary leading-none text-center" style={{ fontSize: 10 }}>Tap to view your design - request changes anytime</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View className="gap-2">
                                            <Text>Left Arm Sleeve — Session 2</Text>
                                            <View className="flex-row w-full justify-between">
                                                <View className="gap-1">
                                                    <Text className="text-text-secondary leading-none text-xs">Sat, July 5, 2025</Text>
                                                    <Text className="text-text-secondary leading-none text-xs">10:00 AM</Text>
                                                </View>
                                                <View className="w-[120px] gap-2">
                                                    <Image source={require('@/assets/images/tattoos/tattoos_17.png')} style={{ width: "100%", height: 60, borderRadius: 5 }} />
                                                    <Text className="text-text-secondary leading-none text-center" style={{ fontSize: 10 }}>Tap to view your design - request changes anytime</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View className="gap-4">
                                            <View className="w-full gap-2">
                                                <Button variant="outline">
                                                    <Text>Reschedule/Cancel</Text>
                                                </Button>
                                                <Text className="text-text-secondary leading-none text-center text-xs">Change your date if needed</Text>
                                            </View>
                                            <View className="w-full gap-2">
                                                <Button variant="outline">
                                                    <Text>Join Cancellation List</Text>
                                                </Button>
                                                <Text className="text-text-secondary leading-none text-center text-xs">Want an earlier spot? Join the list for a chance to move up</Text>
                                            </View>
                                        </View>
                                        <View className="gap-4">
                                            <View className="flex-row items-center justify-start gap-2">
                                                <Text variant="h4">Your Waiver:</Text>
                                                <Image source={require('@/assets/images/icons/rules.png')} style={{ width: 40, height: 40 }} />
                                            </View>
                                            <View className="flex-row gap-2 bg-background-secondary p-4 rounded-lg">
                                                <View className="h-12 w-12 rounded-full bg-foreground items-center justify-center">
                                                    <Icon as={FileText} strokeWidth={2} size={20} className="text-background" />
                                                </View>
                                                <View className="gap-2 flex-1">
                                                    <View style={{ width: 48, height: 19 }} className="border border-green items-center justify-center rounded-full px-1">
                                                        <Text className="text-green text-xs" style={{ fontSize: 10 }}>Signed</Text>
                                                    </View>
                                                    <Text variant="small">Michael's_Tattoo_Agreement.pdf</Text>
                                                    <View className="flex-row items-center gap-1">
                                                        <Text variant="small">Preview</Text>
                                                        <Icon as={FileSearch} strokeWidth={2} size={16} />
                                                    </View>
                                                </View>
                                            </View>
                                            <Text className="text-text-secondary text-sm tracking-wide">If the waiver isn't signed you'll see it here. It's also emailed to you.</Text>
                                        </View>
                                        <View className="flex-row items-center justify-start gap-4">
                                            <Text variant="h5">Reference Photo Upload</Text>
                                            <Image source={require('@/assets/images/icons/camera.png')} style={{ width: 32, height: 32 }} />
                                        </View>
                                        <View className="flex-row items-center justify-start gap-4">
                                            <Text variant="h5">Healed Photo Upload</Text>
                                            <Image source={require('@/assets/images/icons/camera.png')} style={{ width: 32, height: 32 }} />
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