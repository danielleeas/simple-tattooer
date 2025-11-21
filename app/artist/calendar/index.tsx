import { useState } from "react";
import { View, ScrollView, Pressable, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";

import Header from "@/components/lib/Header";
import { Icon } from "@/components/ui/icon";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { getViewLabel } from "@/components/pages/calendar/utils";
import { MonthView } from "@/components/pages/calendar/month";
import { DayView } from "@/components/pages/calendar/day";
import { WeekView } from "@/components/pages/calendar/week";
import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

const Toggle = ({ label, active, onPress }: { label: string; active: boolean; onPress?: () => void }) => (
    <Pressable
        onPress={onPress}
        style={{ width: 72, height: 28 }}
        className={`items-center justify-center rounded-full border ${active ? 'bg-foreground border-foreground' : 'border-border-secondary'}`}
    >
        <Text className={`text-xs ${active ? 'text-background' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
);

export default function CalendarPage() {

    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
    const [isDayMenuOpen, setIsDayMenuOpen] = useState(false);

    const goPrev = () => {
        setCurrentDate((prev) => {
            if (viewMode === 'day') {
                return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1, 12, 0, 0, 0);
            }
            if (viewMode === 'week') {
                return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7, 12, 0, 0, 0);
            }
            // month
            return new Date(prev.getFullYear(), prev.getMonth() - 1, 1, 12, 0, 0, 0);
        });
    };

    const goNext = () => {
        setCurrentDate((prev) => {
            if (viewMode === 'day') {
                return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1, 12, 0, 0, 0);
            }
            if (viewMode === 'week') {
                return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7, 12, 0, 0, 0);
            }
            // month
            return new Date(prev.getFullYear(), prev.getMonth() + 1, 1, 12, 0, 0, 0);
        });
    };

    const onDatePress = (dateString: string) => {
        // Example: handle string in local timezone "YYYY-MM-DDTHH:mm:ss±HH:MM"
        console.log(dateString);
    };

    const onDayTimeSelect = (datetime: string) => {
        console.log(datetime);
    }

    const onWeekTimeSelect = (datetime: string) => {
        console.log(datetime);
    }

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

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={HOME_IMAGE}
                    leftButtonTitle="Home"
                    onLeftButtonPress={() => router.dismissAll()}
                    rightButtonImage={MENU_IMAGE}
                    rightButtonTitle="Menu"
                    onRightButtonPress={() => router.push('/artist/menu')}
                />
                <StableGestureWrapper
                    onSwipeRight={() => router.back()}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4 pb-4 gap-6 items-center justify-center">
                        <View className="flex-row items-center bg-background w-full max-w-[400px]">
                            <Pressable onPress={goPrev}>
                                <Icon as={ChevronLeft} strokeWidth={1} size={24} />
                            </Pressable>

                            <View className="flex-1 flex-row items-center justify-between px-2">
                                <Toggle label="Week" active={viewMode === 'week'} onPress={() => setViewMode('week')} />
                                <Pressable onPress={() => setViewMode('month')}>
                                    <Text className="text-2xl text-foreground" style={{ height: 28, lineHeight: 28 }}>
                                        {getViewLabel(currentDate, viewMode)}
                                    </Text>
                                </Pressable>
                                <Toggle label="Day" active={viewMode === 'day'} onPress={() => setViewMode('day')} />
                            </View>

                            <Pressable onPress={goNext}>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>
                        </View>
                        <View className="flex-1 w-full">
                            {viewMode === 'day' && <DayView currentDate={currentDate} onTimeSelect={onDayTimeSelect} />}
                            {viewMode === 'month' && <MonthView currentDate={currentDate} onDatePress={onDatePress} />}
                            {viewMode === 'week' && <WeekView currentDate={currentDate} onTimeSelect={onWeekTimeSelect} />}
                        </View>

                        <Pressable
                            onPress={openActionModal}
                            accessibilityRole="button"
                            accessibilityLabel="Add"
                            className="absolute right-6 bottom-6 w-14 h-14 rounded-full bg-foreground items-center justify-center"
                        >
                            <Icon as={Plus} size={32} strokeWidth={2} className="text-background" />
                        </Pressable>
                    </View>
                </StableGestureWrapper>

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
                                onPress={closeActionModal}
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
                                onPress={closeActionModal}
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
                                onPress={closeActionModal}
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
                                onPress={closeActionModal}
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
                                onPress={closeActionModal}
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
