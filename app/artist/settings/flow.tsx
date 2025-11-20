import { useState } from "react";
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
import { View, Image, Pressable } from "react-native";
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
import { WorkDayDataProps } from "@/components/pages/your-flow/type";

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
    consultMeetingUrl: '',
};

export default function YourFlow() {
    const { artist } = useAuth();
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const [workDayData, setWorkDayData] = useState<WorkDayDataProps>(defaultWorkDayData);
    const [initialWorkDayData, setInitialWorkDayData] = useState<WorkDayDataProps | null>(null);

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    };

    const handleMenu = () => {
        // router.push('/production/menu');
    };

    const handleSave = async () => {
        if (!artist?.id) return;
        // setSaving(true);

        // setSaving(true)

    }

    const updateWorkDayData = (updates: Partial<WorkDayDataProps>) => {
        setWorkDayData(prev => ({ ...prev, ...updates }));
    };

    console.log(workDayData);

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
                            <KeyboardAwareScrollView bottomOffset={20} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
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
                                            <View></View>
                                        </Collapse>

                                        <Collapse
                                            title="Drawings & Cancellation List"
                                            textClassName="text-2xl"
                                            description="Set how drawings are delivered or changed, and stay covered when plan change."
                                            descriptionClassName="text-sm"
                                        >
                                            <View></View>
                                        </Collapse>
                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}