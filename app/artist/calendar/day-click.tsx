import { View, Image, type ImageStyle, ScrollView, Pressable } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { useAuth } from '@/lib/contexts/auth-context';
import { getEventsInRange, type CalendarEvent } from '@/lib/services/calendar-service';

import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { parseYmdFromDb, isoToLocalHHMM, to12h, toYmd, formatDate } from "@/lib/utils";
import { getEventColorClass } from "@/components/pages/calendar/utils";
import { useFocusEffect } from "expo-router";

const ICON_STYLE: ImageStyle = {
    height: 48,
    width: 48,
}

export default function SingleDate() {
    const router = useRouter();
    const { artist } = useAuth();
    const { date } = useLocalSearchParams<{ date: string }>();
    const [loading, setLoading] = useState<boolean>(false);

    const handleBack = () => {
        router.back();
    };

    const handleDetailEvent = (source: string, source_id: string) => {
        console.log("source", source)
        console.log("source_id", source_id)
        if (source === 'block_time') {
            router.push({
                pathname: '/artist/calendar/event-block-time/[id]',
                params: { id: source_id }
            });
        } 
        else if (source === 'spot_convention') {
            router.push({
                pathname: '/artist/calendar/spot-convention/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'temp_change') {
            router.push({
                pathname: '/artist/calendar/temp-change/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'book_off') {
            router.push({
                pathname: '/artist/calendar/off-days/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'session') {
            router.push({
                pathname: '/artist/clients/detail-session',
                params: { client_id: null, project_id: null, session_id: source_id }
            });
        }
    }

    const [events, setEvents] = useState<CalendarEvent[]>([]);

    const loadEvents = useCallback(async () => {
        if (!artist?.id) return;
        try {
            const currentDate = parseYmdFromDb(date);
            const res = await getEventsInRange({
                artistId: artist.id,
                start: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0),
                end: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999),
            });
            setEvents(res.events || []);
        } catch {
            setEvents([]);
        }
    }, [artist?.id, date]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    useFocusEffect(
        useCallback(() => {
            loadEvents();
        }, [loadEvents])
    );

    const getTimeRangeLabel = (startIso?: string, endIso?: string) => {
        const s = isoToLocalHHMM(startIso);
        const e = isoToLocalHHMM(endIso);
        return `${to12h(s)} - ${to12h(e)}`;
    };

    const getHeaderTitle = () => {
        try {
            const d = parseYmdFromDb(date);
            const selectedYmd = toYmd(d);
            const todayYmd = toYmd(new Date());
            if (selectedYmd === todayYmd) return 'Today';
            return formatDate(selectedYmd, true);
        } catch {
            return 'Today';
        }
    };

    return (
        <>
            <Stack.Screen options={{headerShown: false, animation: 'slide_from_right'}} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                <StableGestureWrapper onSwipeRight={handleBack} threshold={80} enabled={true}>
                    <View className="flex-1 bg-background px-4 pt-2 pb-4 gap-6">
                        <Text variant="h3">{getHeaderTitle()}</Text>
                        <View className="flex-row items-center gap-3">
                            <Image source={APPOINTMENT_IMAGE} style={ICON_STYLE} />
                            <View>
                                <Text variant='h4'>Appointments</Text>
                                <Text variant='small' className="text-text-secondary">Tap a name open appointment details.</Text>
                            </View>
                        </View>
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full">
                                <View className="gap-6">
                                    {loading ? (
                                        <View className="py-6">
                                            <Text variant='h5' className="text-text-secondary">Loading...</Text>
                                        </View>
                                    ) : (events.length === 0 ? (
                                        <View className="py-6">
                                            <Text variant='h5' className="text-text-secondary">No events</Text>
                                        </View>
                                    ) : (
                                        events.map((ev: any) => (
                                            <Pressable key={ev.id} onPress={() => handleDetailEvent(ev.source, ev.source_id)} className="flex-row gap-3">
                                                <View className={`w-4 h-4 rounded-full mt-1 ${getEventColorClass(ev.color || '')}`} ></View>
                                                <View className="gap-2">
                                                    <Text variant='h5'>{ev.title}</Text>
                                                    {ev.type !== 'background' ? (
                                                        <Text variant='small' className="text-text-secondary">{getTimeRangeLabel(ev.start_date, ev.end_date)}</Text>
                                                    ) : ev.source === 'spot_convention' ? (
                                                        <Text variant='small' className="text-text-secondary">Guest Spot/conventions</Text>
                                                    ) : ev.source === 'temp_change' ? (
                                                        <Text variant='small' className="text-text-secondary">Temp change</Text>
                                                    ) : ev.source === 'book_off' ? (
                                                        <Text variant='small' className="text-text-secondary">Book Off Days</Text>
                                                    ) : null}
                                                </View>
                                            </Pressable>
                                        ))
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}