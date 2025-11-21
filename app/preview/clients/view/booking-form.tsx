import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/lib/Header";
import { View, Image, Pressable } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { Input } from "@/components/ui/input";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
// import { locations as locationsMock } from "@/lib/data";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function BookingFormScreen() {

    const [location, setLocation] = useState<string>('');
    const [preferredDay, setPreferredDay] = useState<string>('');
    const [isDepositNonRefundable, setIsDepositNonRefundable] = useState<boolean>(false);

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
                <View className="flex-1 pt-2 pb-4 gap-6">
                    <View className="flex-1">
                        <KeyboardAwareScrollView bottomOffset={50} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                            <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                                <View className="items-center justify-center" style={{ height: 180 }}>
                                    <Image
                                        source={require('@/assets/images/icons/portfolio.png')}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">[Artist name] —</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Booking Form</Text>
                                    <Text className="text-center mt-2 text-text-secondary">I’m  happy you’re here!  Please fill out this</Text>
                                    <Text className="text-center text-text-secondary leading-none">short form so we can get  started.</Text>
                                </View>

                                <Button variant="outline">
                                    <Text>Edit Booking/Consult Form</Text>
                                </Button>

                                <View className="gap-2">
                                    <Text variant="h5">Full Name</Text>
                                    <Input />
                                    <Text className="text-text-secondary">First and last, please</Text>
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Email</Text>
                                    <Input />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Phone Number</Text>
                                    <Input />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">City & Country of Residence</Text>
                                    <Input />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Tattoo Booking Location</Text>
                                    <DropdownPicker
                                        options={[]}
                                        value={location}
                                        onValueChange={setLocation}
                                        placeholder="Select location"
                                        modalTitle="Select Location"
                                    />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Preferred days</Text>
                                    <RadioGroup value={preferredDay} onValueChange={(value) => setPreferredDay(value)}>
                                        <Pressable onPress={() => setPreferredDay('Any')} className="flex-row items-center gap-2">
                                            <RadioGroupItem value="Any" id="monday" />
                                            <Text>Any</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setPreferredDay('Weekdays')} className="flex-row items-center gap-2">
                                            <RadioGroupItem value="Weekdays" id="tuesday" />
                                            <Text>Weekdays</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setPreferredDay('Weekend')} className="flex-row items-center gap-2">
                                            <RadioGroupItem value="Weekend" id="wednesday" />
                                            <Text>Weekend</Text>
                                        </Pressable>
                                    </RadioGroup>
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Please Tell Me Your Tattoo Idea</Text>
                                    <Textarea className="min-h-28" placeholder="Please include size, placement,  colour, or black & grey." />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Anything else I need to know?</Text>
                                    <Textarea className="min-h-28" />
                                </View>

                                <View className="flex-row items-center justify-start gap-4">
                                    <Text variant="h5">Upload Reference Photos (Max 3)</Text>
                                    <Image source={require('@/assets/images/icons/camera.png')} style={{ width: 32, height: 32 }} />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Question 1</Text>
                                    <Textarea className="min-h-28" placeholder="Type your question here" />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Question 2</Text>
                                    <Textarea className="min-h-28" placeholder="Type your question here" />
                                </View>

                                <View className="gap-4">
                                    <View className="flex flex-row items-start gap-3">
                                        <Checkbox
                                            id="terms"
                                            className="mt-1"
                                            checked={isDepositNonRefundable}
                                            onCheckedChange={(checked) => setIsDepositNonRefundable(checked)}
                                        />
                                        <Text
                                            className='flex-1 tracking-wider'
                                            onPress={() => setIsDepositNonRefundable(!isDepositNonRefundable)}
                                        >
                                            I understand that deposits are non - refundable.
                                        </Text>
                                    </View>

                                    <View className="flex flex-row items-start gap-3">
                                        <Checkbox
                                            id="terms"
                                            className="mt-1"
                                            checked={isDepositNonRefundable}
                                            onCheckedChange={(checked) => setIsDepositNonRefundable(checked)}
                                        />
                                        <Text
                                            className='flex-1 tracking-wider'
                                            onPress={() => setIsDepositNonRefundable(!isDepositNonRefundable)}
                                        >
                                            I am of legal age to get tattooed
                                        </Text>
                                    </View>

                                    <View className="flex flex-row items-start gap-3">
                                        <Checkbox
                                            id="terms"
                                            className="mt-1"
                                            checked={isDepositNonRefundable}
                                            onCheckedChange={(checked) => setIsDepositNonRefundable(checked)}
                                        />
                                        <Text
                                            className='flex-1 tracking-wider'
                                            onPress={() => setIsDepositNonRefundable(!isDepositNonRefundable)}
                                        >
                                            I agree to the studio’s Terms & Conditions and Privacy Policy.
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                    <View className="gap-4 items-center justify-center px-4">
                        <Button size="lg" className="w-full">
                            <Text>Update Booking Form</Text>
                        </Button>
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
}