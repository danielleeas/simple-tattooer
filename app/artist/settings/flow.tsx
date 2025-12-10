import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { View, Image, Pressable, Animated } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, PlusIcon } from "lucide-react-native";
import { Trash } from "lucide-react-native";
import { WeekdayToggle } from "@/components/lib/weekday-toggle";
import { TimePicker } from "@/components/lib/time-picker";
import { TimeDurationPicker } from "@/components/lib/time-duration-picker";
import { useAuth, useToast } from "@/lib/contexts";
import { useAppDispatch } from "@/lib/redux/hooks";
import { Collapse } from "@/components/lib/collapse";
import { WorkDay } from "@/components/pages/your-flow/work-day";
import { Booking } from "@/components/pages/your-flow/booking";
import { Drawing } from "@/components/pages/your-flow/drawing";
import { WorkDayDataProps, BookingDataProps, DrawingDataProps } from "@/components/pages/your-flow/type";
import { saveFlowSettings } from "@/lib/services/setting-service";
import { updateArtistFlows } from "@/lib/redux/slices/auth-slice";
import { LoadingOverlay } from "@/components/lib/loading-overlay";

const defaultWorkDayData: WorkDayDataProps = {
    workDays: [],
    diffTimeEnabled: false,
    startTimes: {},
    endTimes: {},
    consultEnabled: false,
    consultInPerson: false,
    consultOnline: false,
    consultDuration: 0,
    consultWorkDays: [],
    diffConsultTimeEnabled: false,
    consultStartTimes: {},
    consultMeetingLink: '',
};

const defaultBookingData: BookingDataProps = {
    multipleSessionsEnabled: false,
    sessionsPerDay: '',
    sessionDuration: '',
    breakTime: '',
    backToBackEnabled: false,
    maxBackToBack: '',
    bufferBetweenSessions: '',
};

const defaultDrawingData: DrawingDataProps = {
    sendDrawingsInAdvance: false,
    receiveDrawingTime: 0,
    changePolicyTime: 0,
    finalAppointmentRemindTime: 0,
    autoEmail: false,
    autoFillDrawing: false,
    maxReschedulesAllowed: '',
    rescheduleBookingDays: 0,
};

export default function YourFlow() {
    const { artist } = useAuth();
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string>('Starting...');
    const [workDayData, setWorkDayData] = useState<WorkDayDataProps>(defaultWorkDayData);
    const [bookingData, setBookingData] = useState<BookingDataProps>(defaultBookingData);
    const [drawingData, setDrawingData] = useState<DrawingDataProps>(defaultDrawingData);
    const [initialWorkDayData, setInitialWorkDayData] = useState<WorkDayDataProps | null>(null);
    const [initialBookingData, setInitialBookingData] = useState<BookingDataProps | null>(null);
    const [initialDrawingData, setInitialDrawingData] = useState<DrawingDataProps | null>(null);
    const saveBarAnim = useRef(new Animated.Value(0)).current;

    const createWorkingDayDataFromArtist = useCallback((artistData: any): WorkDayDataProps => {
        return {
            ...defaultWorkDayData,
            workDays: artistData?.flow?.work_days ?? [],
            diffTimeEnabled: artistData?.flow?.diff_time_enabled ?? false,
            startTimes: artistData?.flow?.start_times ?? {},
            endTimes: artistData?.flow?.end_times ?? {},
            consultEnabled: artistData?.flow?.consult_enabled ?? false,
            consultInPerson: artistData?.flow?.consult_in_person ?? false,
            consultOnline: artistData?.flow?.consult_online ?? false,
            consultDuration: artistData?.flow?.consult_duration ?? 0,
            consultWorkDays: artistData?.flow?.consult_work_days ?? [],
            diffConsultTimeEnabled: artistData?.flow?.diff_consult_time_enabled ?? false,
            consultStartTimes: artistData?.flow?.consult_start_times ?? {},
            consultMeetingLink: artistData?.flow?.consult_meeting_url ?? '',
        };
    }, []);

    const createBookingDataFromArtist = useCallback((artistData: any): BookingDataProps => {
        return {
            ...defaultBookingData,
            multipleSessionsEnabled: artistData?.flow?.multiple_sessions_enabled ?? false,
            sessionsPerDay: artistData?.flow?.sessions_per_day ?? 0,
            sessionDuration: artistData?.flow?.session_duration ?? 0,
            breakTime: artistData?.flow?.break_time ?? 0,
            backToBackEnabled: artistData?.flow?.back_to_back_enabled ?? false,
            maxBackToBack: artistData?.flow?.max_back_to_back ?? 0,
            bufferBetweenSessions: artistData?.flow?.buffer_between_sessions ?? 0,
        };
    }, []);

    const createDrawingDataFromArtist = useCallback((artistData: any): DrawingDataProps => {
        return {
            ...defaultDrawingData,
            sendDrawingsInAdvance: artistData?.flow?.send_drawings_in_advance ?? false,
            receiveDrawingTime: artistData?.flow?.receive_drawing_time ?? 0,
            changePolicyTime: artistData?.flow?.change_policy_time ?? 0,
            finalAppointmentRemindTime: artistData?.flow?.final_appointment_remind_time ?? 0,
            autoEmail: artistData?.flow?.auto_email ?? false,
            autoFillDrawing: artistData?.flow?.auto_fill_drawing_enabled ?? false,
            maxReschedulesAllowed: artistData?.flow?.max_reschedules ?? 0,
            rescheduleBookingDays: artistData?.flow?.reschedule_booking_days ?? 0,
        };
    }, []);

    useEffect(() => {
        if (artist) {
            const wdata = createWorkingDayDataFromArtist(artist);
            setWorkDayData(wdata);
            setInitialWorkDayData(wdata);
            const bdata = createBookingDataFromArtist(artist);
            setBookingData(bdata);
            setInitialBookingData(bdata);
            const ddata = createDrawingDataFromArtist(artist);
            setDrawingData(ddata);
            setInitialDrawingData(ddata);
        } else {
            setWorkDayData(defaultWorkDayData);
            setInitialWorkDayData(null);
            setBookingData(defaultBookingData);
            setInitialBookingData(null);
            setDrawingData(defaultDrawingData);
            setInitialDrawingData(null);
        }
    }, [artist, createWorkingDayDataFromArtist, createBookingDataFromArtist, createDrawingDataFromArtist]);

    const hasChanges = useMemo(() => {
        if (!artist || !initialWorkDayData || !initialBookingData || !initialDrawingData) return false;
        return JSON.stringify(workDayData) !== JSON.stringify(initialWorkDayData) ||
            JSON.stringify(bookingData) !== JSON.stringify(initialBookingData) ||
            JSON.stringify(drawingData) !== JSON.stringify(initialDrawingData);
    }, [workDayData, bookingData, drawingData, initialWorkDayData, initialBookingData, initialDrawingData]);

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
        router.push('/artist/menu');
    };

    const updateWorkDayData = (updates: Partial<WorkDayDataProps>) => {
        setWorkDayData(prev => ({ ...prev, ...updates }));
    };

    const updateBookingData = (update: Partial<BookingDataProps>) => {
        setBookingData(prev => ({ ...prev, ...update }));
    };

    const updateDrawingData = (update: Partial<DrawingDataProps>) => {
        setDrawingData(prev => ({ ...prev, ...update }));
    }

    const handleSave = async () => {
        if (!artist?.id) return;
        try {
            setSaving(true);
            setSaveMessage('Starting...');
            const result = await saveFlowSettings(
                artist.id,
                { workDay: workDayData, booking: bookingData, drawing: drawingData },
                {
                    workDay: initialWorkDayData || defaultWorkDayData,
                    booking: initialBookingData || defaultBookingData,
                    drawing: initialDrawingData || defaultDrawingData,
                },
                (p, label) => {
                    if (label) setSaveMessage(label);
                }
            );

            if (result.success) {
                setInitialWorkDayData(workDayData);
                setInitialBookingData(bookingData);
                setInitialDrawingData(drawingData);

                const flowUpdates = {
                    work_days: workDayData.workDays,
                    diff_time_enabled: !!workDayData.diffTimeEnabled,
                    start_times: workDayData.startTimes,
                    end_times: workDayData.endTimes,
                    consult_enabled: !!workDayData.consultEnabled,
                    consult_in_person: !!workDayData.consultInPerson,
                    consult_online: !!workDayData.consultOnline,
                    consult_duration: Number(workDayData.consultDuration || 0),
                    consult_work_days: workDayData.consultWorkDays,
                    diff_consult_time_enabled: !!workDayData.diffConsultTimeEnabled,
                    consult_start_times: workDayData.consultStartTimes,
                    consult_meeting_url: workDayData.consultMeetingLink || '',

                    multiple_sessions_enabled: !!bookingData.multipleSessionsEnabled,
                    sessions_per_day: Number(bookingData.sessionsPerDay || 0),
                    session_duration: Number(bookingData.sessionDuration || 0),
                    break_time: Number(bookingData.breakTime || 0),
                    back_to_back_enabled: !!bookingData.backToBackEnabled,
                    max_back_to_back: Number(bookingData.maxBackToBack || 0),
                    buffer_between_sessions: Number(bookingData.bufferBetweenSessions || 0),

                    send_drawings_in_advance: !!drawingData.sendDrawingsInAdvance,
                    receive_drawing_time: Number(drawingData.receiveDrawingTime || 0),
                    change_policy_time: Number(drawingData.changePolicyTime || 0),
                    final_appointment_remind_time: Number(drawingData.finalAppointmentRemindTime || 0),
                    auto_email: !!drawingData.autoEmail,
                    auto_fill_drawing_enabled: !!drawingData.autoFillDrawing,
                    max_reschedules: Number(drawingData.maxReschedulesAllowed || 0),
                    reschedule_booking_days: Number(drawingData.rescheduleBookingDays || 0),
                };
                dispatch(updateArtistFlows(flowUpdates as any));

                toast({
                    variant: 'success',
                    title: 'Changes saved successfully',
                    duration: 2500,
                });
            } else {
                toast({
                    variant: 'error',
                    title: result.error || 'Failed to save changes',
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('Error saving flow changes:', error);
            toast({
                variant: 'error',
                title: 'An unexpected error occurred',
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
    }

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
                                bottomOffset={20}
                                contentContainerClassName="w-full"
                                showsVerticalScrollIndicator={false}
                                
                                contentContainerStyle={{
                                    paddingBottom: 80,
                                }}
                            >
                                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                                    <View className="items-center justify-center" style={{ height: 180 }}>
                                        <Image
                                            source={require('@/assets/images/icons/your_flow.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Your</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Flow</Text>
                                        <Text className="text-center mt-2 text-text-secondary">Tap below to fine-tune —</Text>
                                        <Text className="text-center text-text-secondary leading-none">easy, smooth, yours.</Text>
                                    </View>
                                    <View className="gap-6">
                                        <Collapse
                                            title="Work Days & Consults"
                                            textClassName="text-2xl"
                                            description="Tell us when you work (and when you don't)."
                                            descriptionClassName="text-sm"
                                            comment="We'll handle the rest."
                                            commentClassName="text-sm"
                                        >
                                            <WorkDay workDayData={workDayData} updateWorkDayData={updateWorkDayData} />
                                        </Collapse>

                                        <Collapse
                                            title="Bookings"
                                            textClassName="text-2xl"
                                            description="Define how you like to book-change it anytime here, or when you create a quote."
                                            descriptionClassName="text-sm"
                                        >
                                            <Booking bookingData={bookingData} updateBookingData={updateBookingData} />
                                        </Collapse>

                                        <Collapse
                                            title="Drawings & Cancellation List"
                                            textClassName="text-2xl"
                                            description="Set how drawings are delivered or changed, and stay covered when plan change."
                                            descriptionClassName="text-sm"
                                        >
                                            <Drawing drawingData={drawingData} updateDrawingData={updateDrawingData} />
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
                            <View className="px-4 py-4 bg-background">
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
                        </Animated.View>
                    </View>
                </StableGestureWrapper>

                <LoadingOverlay
                    visible={saving}
                    title="Saving changes"
                    subtitle={saveMessage}
                />
            </SafeAreaView>
        </>
    );
}