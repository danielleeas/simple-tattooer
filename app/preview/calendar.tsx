import { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Calendar } from '@/components/ui/calendar';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronRight } from 'lucide-react-native';

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import { setShowPurchase } from "@/lib/redux/slices/ui-slice";
import { useAppDispatch } from "@/lib/redux/hooks";
import SubscribeModal from "@/components/lib/subscribe-modal";

type ViewMode = 'day' | 'week' | 'month';

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const dispatch = useAppDispatch();
    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/preview/menu');
    };

    const handleDateChange = (date: Date) => {
        setCurrentDate(date);
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        // router.push(`/preview/calendar/day-click?date=${date.toISOString()}`);
        dispatch(setShowPurchase(true));
    };

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        if (mode === 'day' && selectedDate) {
            setCurrentDate(selectedDate);
        }
    };

    const handleAddGuestSpot = () => {
        // router.push('/preview/calendar/add-guest-spot');
        dispatch(setShowPurchase(true));
    };

    const handleTemporarilyChange = () => {
        // router.push('/preview/calendar/temporarily-change');
        dispatch(setShowPurchase(true));
    };

    const handleBookOffDays = () => {
        // router.push('/preview/calendar/book-off-days');
        dispatch(setShowPurchase(true));
    };

    return (
        <>
            <Stack.Screen options={{headerShown: false, animation: 'slide_from_right'}} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={HOME_IMAGE}
                    leftButtonTitle="Home"
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
                    <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6 pb-6">
                                    <Calendar
                                        currentDate={currentDate}
                                        onDateChange={handleDateChange}
                                        selectedDate={selectedDate}
                                        onDateSelect={handleDateSelect}
                                        viewMode={viewMode}
                                        onViewModeChange={handleViewModeChange}
                                        height={500}
                                    />
                                    <View className="w-full gap-4">
                                        <Pressable className="flex-row items-start justify-between gap-2" onPress={handleAddGuestSpot}>
                                            <View className="h-4 w-4 rounded-xl bg-orange-500" />
                                            <View className="flex-1">
                                                <Text className="leading-4">Add Guest Spot/ Convention</Text>
                                            </View>
                                            <Icon as={ChevronRight} strokeWidth={1} size={24} />
                                        </Pressable>
                                        <Pressable className="flex-row items-start justify-between gap-2" onPress={handleTemporarilyChange}>
                                            <View className="h-4 w-4 rounded-xl bg-purple" />
                                            <View className="flex-1 gap-1">
                                                <Text className="leading-5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Temporarily Change Your Work Days</Text>
                                                <Text className="text-sm text-text-secondary leading-4" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>This will also change your consult availability.</Text>
                                            </View>
                                            <Icon as={ChevronRight} strokeWidth={1} size={24} />
                                        </Pressable>
                                        <Pressable className="flex-row items-start justify-between gap-2" onPress={handleBookOffDays}>
                                            <View className="h-4 w-4 rounded-xl bg-blue-500" />
                                            <View className="flex-1 gap-1">
                                                <Text className="leading-5">Book Off Multiple Days In A Row</Text>
                                                <Text className="text-sm text-text-secondary leading-4">Make these days unavailable for auto booking and consults.</Text>
                                            </View>
                                            <Icon as={ChevronRight} strokeWidth={1} size={24} />
                                        </Pressable>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </StableGestureWrapper>

                <SubscribeModal />
            </SafeAreaView>
        </>
    );
}
