import { useState } from "react";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientHeader from "@/components/lib/client-header";
import { View, Image, ImageBackground, Pressable, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DepositPolicyModal from "@/app/client/appointments/modals/deposit-policy-modal";
import CancellationPolicyModal from "@/app/client/appointments/modals/cancellation-policy-modal";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { useToast } from "@/lib/contexts/toast-context";
import RescheduleModal from "./modals/reschedule-modal";
import CancellationModal from "./modals/cancellation-modal";

export default function ConfirmAppointment() {
    const { toast } = useToast();
    const [canComeToSession, setCanComeToSession] = useState<string>('');
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [depositPolicyModalOpen, setDepositPolicyModalOpen] = useState(false);
    const [cancellationPolicyModalOpen, setCancellationPolicyModalOpen] = useState(false);

    const handleBack = () => {
        router.back();
    };

    const handleContinue = () => {
        if (canComeToSession === 'attend') {
            router.push('/client/appointments/review-drawing');
        } else if (canComeToSession === 'reschedule') {
            setRescheduleModalOpen(true);
        } else if (canComeToSession === 'cancel') {
            setCancelModalOpen(true);
        }
    }

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
                        <View className="flex-1">
                            <KeyboardAwareScrollView bottomOffset={50} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                                    <View className="items-center justify-center" style={{ height: 180 }}>
                                        <Image
                                            source={require('@/assets/images/icons/calendar.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Confirm</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Appointment</Text>
                                        <Text className="text-center mt-2 text-text-secondary">Please let us know if you’ll be there!</Text>
                                    </View>

                                    <View className="gap-6">
                                        <View className="flex-row w-full justify-between">
                                            <View className="flex-1 gap-2">
                                                <Text variant="h5">Right Arm Sleeve — Session 1</Text>
                                                <Text className="text-text-secondary leading-none">09.00am - 11.00am</Text>
                                                <Text className="text-text-secondary leading-none">Dark Ocean Tattoo Studio</Text>
                                            </View>
                                            <View className="w-[120px] gap-2">
                                                <Image source={require('@/assets/images/tattoos/tattoos_18.png')} style={{ width: "100%", height: 80, borderRadius: 5 }} />
                                            </View>
                                        </View>

                                        <View className="gap-4">
                                            <Text variant="h5">Can you come to the session?</Text>
                                            <RadioGroup value={canComeToSession} onValueChange={(value) => setCanComeToSession(value)}>
                                                <View className="flex-row items-center gap-2">
                                                    <RadioGroupItem value="attend" id="attend" />
                                                    <Text onPress={() => setCanComeToSession('attend')}>Yes, I can attend</Text>
                                                </View>
                                                <View className="flex-row items-center gap-2">
                                                    <RadioGroupItem value="reschedule" id="reschedule" />
                                                    <Text onPress={() => setCanComeToSession('reschedule')}>I want to reschedule</Text>
                                                </View>
                                                <View className="flex-row items-center gap-2">
                                                    <RadioGroupItem value="cancel" id="cancel" />
                                                    <Text onPress={() => setCanComeToSession('cancel')}>Sorry, I need to cancel</Text>
                                                </View>
                                            </RadioGroup>
                                        </View>

                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                        <View className="gap-4 items-center justify-center px-4">
                            <Button size="lg" className="w-full" onPress={handleContinue}>
                                <Text>Continue</Text>
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>

                <RescheduleModal
                    visible={rescheduleModalOpen}
                    onClose={() => setRescheduleModalOpen(false)}
                    onOpenDepositPolicy={() => setDepositPolicyModalOpen(true)}
                    onOpenCancellationPolicy={() => setCancellationPolicyModalOpen(true)}
                />

                <CancellationModal
                    visible={cancelModalOpen}
                    onClose={() => setCancelModalOpen(false)}
                    onOpenDepositPolicy={() => setDepositPolicyModalOpen(true)}
                    onOpenCancellationPolicy={() => setCancellationPolicyModalOpen(true)}
                />

                <DepositPolicyModal
                    visible={depositPolicyModalOpen}
                    onClose={() => setDepositPolicyModalOpen(false)}
                />

                <CancellationPolicyModal
                    visible={cancellationPolicyModalOpen} 
                    onClose={() => setCancellationPolicyModalOpen(false)}
                />
            </SafeAreaView>
        </>
    );
}