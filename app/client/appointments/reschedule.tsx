import { useState } from "react";
import { RelativePathString, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientHeader from "@/components/lib/client-header";
import { View, Image, ImageBackground, Pressable, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
// import { MobileDialog, MobileDialogContent, MobileDialogTitle } from "@/components/lib/mobile-dialog";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DepositPolicyModal from "@/app/client/appointments/modals/deposit-policy-modal";
import CancellationPolicyModal from "@/app/client/appointments/modals/cancellation-policy-modal";
import RescheduleModal from "@/app/client/appointments/modals/reschedule-modal";
import CancellationModal from "@/app/client/appointments/modals/cancellation-modal";

import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { useToast } from "@/lib/contexts/toast-context";

export default function RescheduleCancel() {
    const { toast } = useToast();
    const [sessionDate, setSessionDate] = useState<string | undefined>();
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [depositPolicyModalOpen, setDepositPolicyModalOpen] = useState(false);
    const [cancellationPolicyModalOpen, setCancellationPolicyModalOpen] = useState(false);
    const [rescheduleMessage, setRescheduleMessage] = useState<string | undefined>();
    const [cancelMessage, setCancelMessage] = useState<string | undefined>();
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<'cancel' | 'reschedule' | undefined>('reschedule');

    const dayRangesChunks = [
        [{ value: '2025-08-02', label: 'Aug 2, 2025' }, { value: '2025-10-08', label: 'Oct 8, 2025' }],
        [{ value: '2025-09-05', label: 'Sept 5, 2025' }]
    ]

    const handleDateSelect = (date: string) => {
        setSessionDate(date);
        setRescheduleModalOpen(true);
    };

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
                                        source={require('@/assets/images/icons/not_smile.png')}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Cancel /</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Reschedule</Text>
                                    <Text className="text-center mt-2 text-text-secondary">Choose the date that you want to cancel/</Text>
                                    <Text className="text-center text-text-secondary leading-none">reschedule</Text>
                                </View>

                                <View>
                                    <Text className="mt-2 text-text-secondary">Do you want to cancel/reschedule?</Text>
                                    <RadioGroup className="mt-2" value={selectedAction} onValueChange={(value) => {
                                        setSelectedAction(value as 'cancel' | 'reschedule');
                                    }}>
                                        <View className="flex-row items-center gap-2">
                                            <RadioGroupItem value="reschedule" id="reschedule" />
                                            <Text className="text-text-secondary" onPress={() => setSelectedAction('reschedule')}>Reschedule</Text>
                                        </View>
                                        <View className="flex-row items-center gap-2">
                                            <RadioGroupItem value="cancel" id="cancel" />
                                            <Text className="text-text-secondary" onPress={() => setSelectedAction('cancel')}>Cancel</Text>
                                        </View>
                                    </RadioGroup>
                                </View>

                                <View className="gap-6">
                                    <View className="gap-2">
                                        {dayRangesChunks.map((rages, index) => (
                                            <View key={index} className="gap-2 flex-row items-center justify-between">
                                                {rages.map((day, index1) => (
                                                    <Button
                                                        onPress={() => {
                                                            if (selectedAction === 'cancel') {
                                                                setCancelModalOpen(true);
                                                            } else if (selectedAction === 'reschedule') {
                                                                setRescheduleModalOpen(true);
                                                            }
                                                        }}
                                                        key={index1}
                                                        variant={sessionDate === day.value ? 'default' : 'outline'}
                                                        className="flex-1 h-8 p-0 max-w-[170px]">
                                                        <Text>{day.label}</Text>
                                                    </Button>
                                                ))}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper>

                <RescheduleModal
                    visible={rescheduleModalOpen}
                    onClose={() => {
                        setRescheduleModalOpen(false);
                        setSelectedAction(undefined);
                    }}
                    sessionDate={sessionDate}
                    onDateSelect={handleDateSelect}
                    onOpenDepositPolicy={() => setDepositPolicyModalOpen(true)}
                    onOpenCancellationPolicy={() => setCancellationPolicyModalOpen(true)}
                />

                <CancellationModal
                    visible={cancelModalOpen}
                    onClose={() => {
                        setCancelModalOpen(false);
                        setSelectedAction(undefined);
                    }}
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