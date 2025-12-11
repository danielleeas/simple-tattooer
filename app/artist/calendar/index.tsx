import { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { formatYmd, parseYmdFromDb, toYmd } from "@/lib/utils";

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
import { CalendarEvent, getEventsInRange } from "@/lib/services/calendar-service";
import { useAuth } from "@/lib/contexts/auth-context";

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
    const { artist } = useAuth();
    const { mode } = useLocalSearchParams<{ mode?: string }>();
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
    const [isDayMenuOpen, setIsDayMenuOpen] = useState(false);
    const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});

    const getMonthGridRange = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        const start = new Date(firstDay);
        start.setDate(start.getDate() - firstDayOfWeek);
        const end = new Date(start);
        end.setDate(end.getDate() + 41); // 6*7 - 1
        return { start, end };
    }, [currentDate]);

    const loadEvents = useCallback(async () => {
        if (!artist?.id) return;
        try {
            const { start, end } = getMonthGridRange;
            const res = await getEventsInRange({
                artistId: artist.id,
                start: start,
                end: end,
            });
            const events = res.events || [];

            const visibleStart = new Date(getMonthGridRange.start.getFullYear(), getMonthGridRange.start.getMonth(), getMonthGridRange.start.getDate(), 12);
            const visibleEnd = new Date(getMonthGridRange.end.getFullYear(), getMonthGridRange.end.getMonth(), getMonthGridRange.end.getDate(), 12);

            // Map DB rows to Calendar's expected shape
            const map: Record<string, CalendarEvent[]> = {};
            for (const ev of events) {
                const evStart = parseYmdFromDb(ev.start_date);
                const evEnd = parseYmdFromDb(ev.end_date);

                const rangeStart = evStart < visibleStart ? visibleStart : evStart;
                const rangeEnd = evEnd > visibleEnd ? visibleEnd : evEnd;
                const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate(), 12);
                while (cursor <= rangeEnd) {
                    const key = toYmd(cursor);
                    if (!map[key]) map[key] = [];
                    map[key].push(ev);
                    cursor.setDate(cursor.getDate() + 1);
                }
            }
            setEvents(map);
        } catch (e) {
            setEvents({});
        }
    }, [artist?.id, getMonthGridRange]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    useFocusEffect(
        useCallback(() => {
            if (mode === 'day' || mode === 'week' || mode === 'month') {
                setViewMode(mode as 'day' | 'week' | 'month');
                router.setParams({ mode: undefined });
            }
            loadEvents();
        }, [loadEvents, mode])
    );

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
        setViewMode('day');
        setCurrentDate(parseYmdFromDb(dateString));
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

    const openSpotConventionAdd = () => {
        router.push('/artist/calendar/spot-convention/add');
        closeActionModal();
    }

    const openTempChangeAdd = () => {
        router.push('/artist/calendar/temp-change/add');
        closeActionModal();
    }

    const openOffDaysAdd = () => {
        router.push('/artist/calendar/off-days/add');
        closeActionModal();
    }

    const openEventBlockTimeAdd = () => {
        router.push({
            pathname: '/artist/calendar/event-block-time/add',
            params: { date: formatYmd(currentDate) },
        });
        closeActionModal();
    }

    const openQuickAppointmentAdd = () => {
        router.push({
            pathname: '/artist/calendar/quick-appointment/add',
            params: { date: formatYmd(currentDate) },
        });
        closeActionModal();
    }

    const openMarkUnavailableAdd = () => {
        router.push({
            pathname: '/artist/calendar/unavailable',
            params: { date: formatYmd(currentDate) },
        });
        closeActionModal();
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
                    onSwipeRight={goPrev}
                    onSwipeLeft={goNext}
                    threshold={80}
                    enabled={viewMode === 'month'}
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
                            {viewMode === 'day' && <DayView currentDate={currentDate} events={events} />}
                            {viewMode === 'month' && <MonthView currentDate={currentDate} onDatePress={onDatePress} events={events} />}
                            {viewMode === 'week' && <WeekView currentDate={currentDate} events={events} />}
                        </View>

                        {(!isMonthMenuOpen && !isDayMenuOpen) && (
                            <Pressable
                                onPress={openActionModal}
                                accessibilityRole="button"
                                accessibilityLabel="Add"
                                className="absolute right-6 bottom-6 w-14 h-14 rounded-full bg-foreground items-center justify-center"
                            >
                                <Icon as={Plus} size={32} strokeWidth={2} className="text-background" />
                            </Pressable>
                        )}
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
                            className="w-full max-w-[300px] bg-background-secondary rounded-xl border border-border p-4 gap-4"
                        >
                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openSpotConventionAdd}
                                accessibilityRole="button"
                                accessibilityLabel="Add Guest Spot or Convention"
                            >
                                <View className="h-4 w-4 rounded-xl bg-orange-500" />
                                <View className="flex-1">
                                    <Text className="leading-5 text-sm">Add Guest Spot/ Convention</Text>
                                </View>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>

                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openTempChangeAdd}
                                accessibilityRole="button"
                                accessibilityLabel="Temporarily Change Your Work Days"
                            >
                                <View className="h-4 w-4 rounded-xl bg-purple" />
                                <View className="flex-1 gap-1">
                                    <Text className="leading-5 text-sm" numberOfLines={1}>
                                        Temporarily Change Your Work Days
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>

                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openOffDaysAdd}
                                accessibilityRole="button"
                                accessibilityLabel="Book Off Multiple Days In A Row"
                            >
                                <View className="h-4 w-4 rounded-xl bg-blue-500" />
                                <View className="flex-1 gap-1">
                                    <Text className="leading-5 text-sm">Book Off Multiple Days In A Row</Text>
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
                            className="w-full max-w-[300px] bg-background-secondary rounded-xl border border-border p-4 gap-4"
                        >
                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openEventBlockTimeAdd}
                                accessibilityRole="button"
                                accessibilityLabel="Add Event/ Block Time"
                            >
                                <View className="h-4 w-4 rounded-xl bg-green" />
                                <View className="flex-1 gap-1">
                                    <Text className="leading-5 text-sm">Add Event/ Block Time</Text>
                                </View>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>

                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openQuickAppointmentAdd}
                                accessibilityRole="button"
                                accessibilityLabel="Quick Add Appointment"
                            >
                                <View className="h-4 w-4 rounded-xl" style={{ backgroundColor: '#64748B' }} />
                                <View className="flex-1 gap-1">
                                    <Text className="leading-5 text-sm" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                        Quick Add Appointment
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} strokeWidth={1} size={24} />
                            </Pressable>

                            <Pressable
                                className="flex-row items-start justify-between gap-2"
                                onPress={openMarkUnavailableAdd}
                                accessibilityRole="button"
                                accessibilityLabel="Quick Add Appointment"
                            >
                                <View className="h-4 w-4 rounded-xl bg-blue-500" />
                                <View className="flex-1 gap-1">
                                    <Text className="leading-5 text-sm" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                        Mark Day as Unavailable
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
