import { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";

import Header from "@/components/lib/Header";
import { Icon } from "@/components/ui/icon";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { getViewLabel } from "@/components/pages/calendar/utils";
import { MonthView } from "@/components/pages/calendar/month";

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
								<Toggle label="Day" active={viewMode === 'day'} onPress={() => setViewMode('day')} />
                                <Pressable onPress={() => setViewMode('month')}>
                                    <Text className="text-2xl text-foreground" style={{ height: 28, lineHeight: 28 }}>
                                        {getViewLabel(currentDate, viewMode)}
                                    </Text>
                                </Pressable>
								<Toggle label="Week" active={viewMode === 'week'} onPress={() => setViewMode('week')} />
                            </View>

                            <Pressable onPress={goNext}>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>
                        </View>
                        <View className="flex-1 w-full">
                            <MonthView currentDate={currentDate} />
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
