import { useState } from "react";
import { View, ScrollView, Pressable, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Calendar } from '@/components/ui/calendar';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronRight, Plus } from 'lucide-react-native';

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
    const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
    const [isDayMenuOpen, setIsDayMenuOpen] = useState(false);

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

    const openActionModal = () => {
        if (viewMode === 'month' || viewMode === 'week') {
            setIsMonthMenuOpen(true);
        } else if (viewMode === 'day') {
            setIsDayMenuOpen(true);
        }
    }

    const closeActionModal = () => {
        setIsMonthMenuOpen(false);
        setIsDayMenuOpen(false);
    }

    const openSubscribeModal = () => {
        closeActionModal();
        dispatch(setShowPurchase(true));
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
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
                    <View className="flex-1 bg-background px-4 pt-2 pb-4 gap-6">
                        <View className="flex-1">
                            <Calendar
                                currentDate={currentDate}
                                onDateChange={handleDateChange}
                                selectedDate={selectedDate}
                                onDateSelect={handleDateSelect}
                                viewMode={viewMode}
                                onViewModeChange={handleViewModeChange}
                                height={500}
                            />
                            <Pressable
                                onPress={openActionModal}
                                accessibilityRole="button"
                                accessibilityLabel="Add"
                                className="absolute right-4 bottom-4 w-14 h-14 rounded-full bg-foreground items-center justify-center"
                            >
                                <Icon as={Plus} size={32} strokeWidth={2} className="text-background" />
                            </Pressable>
                        </View>
                    </View>
                </StableGestureWrapper>

                <SubscribeModal />

                <Modal
                    visible={isMonthMenuOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={closeActionModal}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        className="flex-1 bg-black/50 items-center justify-center p-4"
                        onPress={closeActionModal}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-background-secondary rounded-xl border border-border p-4 gap-4"
                        >
                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openSubscribeModal}
                                accessibilityRole="button"
                                accessibilityLabel="Add Guest Spot or Convention"
                            >
                                <View className="h-4 w-4 rounded-xl bg-orange-500" />
                                <View className="flex-1">
                                    <Text className="leading-4">Add Guest Spot/ Convention</Text>
                                </View>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>

                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openSubscribeModal}
                                accessibilityRole="button"
                                accessibilityLabel="Temporarily Change Your Work Days"
                            >
                                <View className="h-4 w-4 rounded-xl bg-purple" />
                                <View className="flex-1 gap-1">
                                    <Text className="leading-5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                        Temporarily Change Your Work Days
                                    </Text>
                                    <Text className="text-sm text-text-secondary leading-4" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                        This will also change your consult availability.
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>

                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openSubscribeModal}
                                accessibilityRole="button"
                                accessibilityLabel="Book Off Multiple Days In A Row"
                            >
                                <View className="h-4 w-4 rounded-xl bg-blue-500" />
                                <View className="flex-1 gap-1">
                                    <Text className="leading-5">Book Off Multiple Days In A Row</Text>
                                    <Text className="text-sm text-text-secondary leading-4">
                                        Make these days unavailable for auto booking and consults.
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                <Modal
                    visible={isDayMenuOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={closeActionModal}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        className="flex-1 bg-black/50 items-center justify-center p-4"
                        onPress={closeActionModal}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-background-secondary rounded-xl border border-border p-4 gap-4"
                        >
                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openSubscribeModal}
                                accessibilityRole="button"
                                accessibilityLabel="Quick Add Appointment"
                            >
                                <View className="h-4 w-4 rounded-xl" style={{ backgroundColor: '#64748B' }} />
                                <View className="flex-1 gap-1">
                                    <Text className="leading-5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                        Quick Add Appointment
                                    </Text>
                                    <Text className="text-xs text-text-secondary leading-4">
                                        Fast Add for Conventions & Walk-Ins. Save the client, skip the emails.
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>

                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openSubscribeModal}
                                accessibilityRole="button"
                                accessibilityLabel="Add Event/ Block Time"
                            >
                                <View className="h-4 w-4 rounded-xl bg-green" />
                                <View className="flex-1 gap-1">
                                    <Text className="leading-5">Add Event/ Block Time</Text>
                                    <Text className="text-xs text-text-secondary leading-4">
                                        Add personal events and coffee dates, or turn off auto booking & consults for the day
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            </SafeAreaView>
        </>
    );
}
