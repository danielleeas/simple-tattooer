import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Icon } from "@/components/ui/icon";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import Header from "@/components/lib/Header";
import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import { View, Image, Pressable, TouchableWithoutFeedback, Keyboard, Animated } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FilePicker } from "@/components/lib/file-picker";
import { useAuth, useToast } from "@/lib/contexts";
import { useAppDispatch } from "@/lib/redux/hooks";
import { Collapse } from "@/components/lib/collapse";
import { Deposit } from "@/components/pages/your-rule/deposit";
import { Policy } from "@/components/pages/your-rule/policy";
import { Template } from "@/components/pages/your-rule/template";
import { DepositDataProps, PolicyDataProps, TemplateDataProps, defaultTemplateData } from "@/components/pages/your-rule/type";


const defaultDepositData: DepositDataProps = {
    depositAmount: 100,
    depositHoldTime: 12,
    depositRemindTime: 12,
    paypalEnabled: false,
    paypalMethod: '',
    etransferEnabled: false,
    etransferMethod: '',
    creditcardEnabled: false,
    creditcardMethod: '',
    venmoEnabled: false,
    venmoMethod: '',
}

const defaultPolicyData: PolicyDataProps = {
    cancellationPolicy: '',
    reschedulePolicy: '',
    depositPolicy: '',
    questionOne: '',
    questionTwo: '',
    waiverText: '',
    privacyPolicy: '',
    termsOfCondition: '',
}

export default function YourRules() {
    const { toast } = useToast();
    const { artist } = useAuth();
    const dispatch = useAppDispatch();

    const [saving, setSaving] = useState(false);
    const [depositData, setDepositData] = useState<DepositDataProps>(defaultDepositData);
    const [policyData, setPolicyData] = useState<PolicyDataProps>(defaultPolicyData);
    const [templateData, setTemplateData] = useState<TemplateDataProps>(defaultTemplateData);
    const [initialDepositData, setInitialDepositData] = useState<DepositDataProps | null>(null);
    const [initialPolicyData, setInitialPolicyData] = useState<PolicyDataProps | null>(null);
    const [initialTemplateData, setInitialTemplateData] = useState<TemplateDataProps | null>(null);
    const saveBarAnim = useRef(new Animated.Value(0)).current;

    const createDepositDataFromArtist = useCallback((artistData: any): DepositDataProps => {
        return {
            ...defaultDepositData,
            depositAmount: artistData?.rule?.deposit_amount ?? 100,
            depositHoldTime: artistData?.rule?.deposit_hold_time ?? 12,
            depositRemindTime: artistData?.rule?.deposit_remind_time ?? 12,
            paypalEnabled: artistData?.rule?.paypal_enabled ?? false,
            paypalMethod: artistData?.rule?.paypal_method ?? '',
            etransferEnabled: artistData?.rule?.etransfer_enabled ?? false,
            etransferMethod: artistData?.rule?.etransfer_method ?? '',
            creditcardEnabled: artistData?.rule?.creditcard_enabled ?? false,
            creditcardMethod: artistData?.rule?.creditcard_method ?? '',
            venmoEnabled: artistData?.rule?.venmo_enabled ?? false,
            venmoMethod: artistData?.rule?.venmo_method ?? '',
        };
    }, []);

    const createPolicyDataFromArtist = useCallback((artistData: any): PolicyDataProps => {
        return {
            ...defaultPolicyData,
            cancellationPolicy: artistData?.rule?.cancellation_policy ?? '',
            reschedulePolicy: artistData?.rule?.reschedule_policy ?? '',
            depositPolicy: artistData?.rule?.deposit_policy ?? '',
            questionOne: artistData?.rule?.question_one ?? '',
            questionTwo: artistData?.rule?.question_two ?? '',
            waiverText: artistData?.rule?.waiver_text ?? '',
            privacyPolicy: artistData?.rule?.privacy_policy ?? '',
            termsOfCondition: artistData?.rule?.terms_of_condition ?? '',
        };
    }, []);

    const createTemplateDataFromArtist = useCallback((artistData: any): TemplateDataProps => {
        return {
            ...defaultTemplateData,
            newBookingRequestReceivedSubject: artistData?.template?.new_booking_request_received_subject ?? defaultTemplateData.newBookingRequestReceivedSubject,
            newBookingRequestReceivedBody: artistData?.template?.new_booking_request_received_body ?? defaultTemplateData.newBookingRequestReceivedBody,
            bookingRequestApprovedAutoSubject: artistData?.template?.booking_request_approved_auto_subject ?? defaultTemplateData.bookingRequestApprovedAutoSubject,
            bookingRequestApprovedAutoBody: artistData?.template?.booking_request_approved_auto_body ?? defaultTemplateData.bookingRequestApprovedAutoBody,
            bookingRequestApprovedManualSubject: artistData?.template?.booking_request_approved_manual_subject ?? defaultTemplateData.bookingRequestApprovedManualSubject,
            bookingRequestApprovedManualBody: artistData?.template?.booking_request_approved_manual_body ?? defaultTemplateData.bookingRequestApprovedManualBody,
            declinedBookingRequestSubject: artistData?.template?.declined_booking_request_subject ?? defaultTemplateData.declinedBookingRequestSubject,
            declinedBookingRequestBody: artistData?.template?.declined_booking_request_body ?? defaultTemplateData.declinedBookingRequestBody,
            depositPaymentReminderSubject: artistData?.template?.deposit_payment_reminder_subject ?? defaultTemplateData.depositPaymentReminderSubject,
            depositPaymentReminderBody: artistData?.template?.deposit_payment_reminder_body ?? defaultTemplateData.depositPaymentReminderBody,
            depositForfeitSubject: artistData?.template?.deposit_forfeit_subject ?? defaultTemplateData.depositForfeitSubject,
            depositForfeitBody: artistData?.template?.deposit_forfeit_body ?? defaultTemplateData.depositForfeitBody,
            depositKeepSubject: artistData?.template?.deposit_keep_subject ?? defaultTemplateData.depositKeepSubject,
            depositKeepBody: artistData?.template?.deposit_keep_body ?? defaultTemplateData.depositKeepBody,
            consultConfirmationSubject: artistData?.template?.consult_confirmation_subject ?? defaultTemplateData.consultConfirmationSubject,
            consultConfirmationBody: artistData?.template?.consult_confirmation_body ?? defaultTemplateData.consultConfirmationBody,
            consultReminderSubject: artistData?.template?.consult_reminder_subject ?? defaultTemplateData.consultReminderSubject,
            consultReminderBody: artistData?.template?.consult_reminder_body ?? defaultTemplateData.consultReminderBody,
            consultDeclinedSubject: artistData?.template?.consult_declined_subject ?? defaultTemplateData.consultDeclinedSubject,
            consultDeclinedBody: artistData?.template?.consult_declined_body ?? defaultTemplateData.consultDeclinedBody,
            appointmentConfirmationNoProfileSubject: artistData?.template?.appointment_confirmation_no_profile_subject ?? defaultTemplateData.appointmentConfirmationNoProfileSubject,
            appointmentConfirmationNoProfileBody: artistData?.template?.appointment_confirmation_no_profile_body ?? defaultTemplateData.appointmentConfirmationNoProfileBody,
            appointmentConfirmationWithProfileSubject: artistData?.template?.appointment_confirmation_with_profile_subject ?? defaultTemplateData.appointmentConfirmationWithProfileSubject,
            appointmentConfirmationWithProfileBody: artistData?.template?.appointment_confirmation_with_profile_body ?? defaultTemplateData.appointmentConfirmationWithProfileBody,
            appointmentFinalConfirmationSubject: artistData?.template?.appointment_final_confirmation_subject ?? defaultTemplateData.appointmentFinalConfirmationSubject,
            appointmentFinalConfirmationBody: artistData?.template?.appointment_final_confirmation_body ?? defaultTemplateData.appointmentFinalConfirmationBody,
            waiverReminderSubject: artistData?.template?.waiver_reminder_subject ?? defaultTemplateData.waiverReminderSubject,
            waiverReminderBody: artistData?.template?.waiver_reminder_body ?? defaultTemplateData.waiverReminderBody,
            healingCheckInSubject: artistData?.template?.healing_check_in_subject ?? defaultTemplateData.healingCheckInSubject,
            healingCheckInBody: artistData?.template?.healing_check_in_body ?? defaultTemplateData.healingCheckInBody,
            cancellationNotificationSubject: artistData?.template?.cancellation_notification_subject ?? defaultTemplateData.cancellationNotificationSubject,
            cancellationNotificationBody: artistData?.template?.cancellation_notification_body ?? defaultTemplateData.cancellationNotificationBody,
        };
    }, []);

    useEffect(() => {
        if (artist) {
            const ddata = createDepositDataFromArtist(artist);
            setDepositData(ddata);
            setInitialDepositData(ddata);
            const pdata = createPolicyDataFromArtist(artist);
            setPolicyData(pdata);
            setInitialPolicyData(pdata);
            const tdata = createTemplateDataFromArtist(artist);
            setTemplateData(tdata);
            setInitialTemplateData(tdata);
        } else {
            setDepositData(defaultDepositData);
            setInitialDepositData(null);
            setPolicyData(defaultPolicyData);
            setInitialPolicyData(null);
            setTemplateData(defaultTemplateData);
            setInitialTemplateData(null);
        }
    }, [artist, createDepositDataFromArtist, createPolicyDataFromArtist, createTemplateDataFromArtist]);

    const hasTemplateChanges = useMemo(() => {
        if (!artist || !initialTemplateData) return false;
        return JSON.stringify(templateData) !== JSON.stringify(initialTemplateData);
    }, [templateData, initialTemplateData]);

    const hasChanges = useMemo(() => {
        if (!artist || !initialDepositData || !initialPolicyData) return false;
        return JSON.stringify(depositData) !== JSON.stringify(initialDepositData) ||
            JSON.stringify(policyData) !== JSON.stringify(initialPolicyData) ||
            hasTemplateChanges;
    }, [depositData, policyData, hasTemplateChanges, initialDepositData, initialPolicyData]);

    useEffect(() => {
        Animated.timing(saveBarAnim, {
            toValue: hasChanges ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [hasChanges, saveBarAnim]);

    const saveBarTranslateY = saveBarAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [80, 0],
    });

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    };

    const handleMenu = () => {
        // router.push('/production/menu');
    };

    const updateDepositData = (updates: Partial<DepositDataProps>) => {
        setDepositData(prev => ({ ...prev, ...updates }));
    };

    const updatePolicyData = (updates: Partial<PolicyDataProps>) => {
        setPolicyData(prev => ({ ...prev, ...updates }));
    };

    const updateTemplateData = (updates: Partial<TemplateDataProps>) => {
        setTemplateData(prev => ({ ...prev, ...updates }));
    };

    const handleResetTemplateToDefault = () => {
        setTemplateData(defaultTemplateData);
    };

    const handleSave = async () => {
        if (!artist?.id) {
            toast({
                title: 'Error',
                description: 'Artist ID not found. Please try again.',
                variant: 'error',
                duration: 3000,
            });
            return;
        }

        setSaving(true);
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={HOME_IMAGE}
                    leftButtonTitle="Today"
                    onLeftButtonPress={handleHome}
                    rightButtonImage={MENU_IMAGE}
                    rightButtonTitle="Menu"
                    onRightButtonPress={handleMenu}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 pt-2 gap-6">
                        <View className="flex-1">
                            <KeyboardAwareScrollView
                                bottomOffset={50}
                                contentContainerClassName="w-full"
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingBottom: 80 }}
                            >
                                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                                    <View className="items-center justify-center" style={{ height: 180 }}>
                                        <Image
                                            source={require('@/assets/images/icons/rules.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Your</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">rules</Text>
                                        <Text className="text-center mt-2 text-text-secondary">Tap below to shape your policies, your waiver, your words - your way</Text>
                                    </View>
                                    <View className="gap-6">
                                        <Collapse
                                            title="Deposits & Payments"
                                            textClassName="text-2xl"
                                            description="Set how you handle deposits and payment methods"
                                            descriptionClassName="text-sm"
                                        >
                                            <Deposit depositData={depositData} updateDepositData={updateDepositData} />
                                        </Collapse>

                                        <Collapse
                                            title="Add  & Edit Forms & Policies"
                                            textClassName="text-2xl"
                                            description="Edit your booking/consult forms, waiver, privacy policy, Artist's Policies"
                                            descriptionClassName="text-sm"
                                        >
                                            <Policy policyData={policyData} updatePolicyData={updatePolicyData} />
                                        </Collapse>

                                        <Collapse
                                            title="Email Templates (Editable)"
                                            textClassName="text-2xl"
                                            description="Edit your go-to client emails"
                                            descriptionClassName="text-sm"
                                        >
                                            <Template templateData={templateData} updateTemplateData={updateTemplateData} />
                                        </Collapse>
                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                        <Animated.View
                            pointerEvents={hasChanges ? 'auto' : 'none'}
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                transform: [{ translateY: saveBarTranslateY }],
                                opacity: saveBarAnim,
                            }}
                        >
                            <View className="px-4 py-4 bg-background flex-row gap-4">
                                <View className="flex-1">
                                    <Button
                                        variant="outline"
                                        onPress={handleResetTemplateToDefault}
                                        disabled={saving || !hasTemplateChanges}
                                        className="w-full"
                                    >
                                        <Text className="text-white font-semibold">Restore to Default</Text>
                                    </Button>
                                </View>
                                <View className="flex-1">
                                    <Button
                                        variant="outline"
                                        onPress={handleSave}
                                        disabled={saving || !hasChanges}
                                        className="w-full"
                                    >
                                        <Text className="text-white font-semibold">
                                            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
                                        </Text>
                                    </Button>
                                </View>
                            </View>
                        </Animated.View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}