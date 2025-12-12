import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientHeader from "@/components/lib/client-header";
import { View, Image, Pressable, Modal, ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { FileSearch, FileText } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from '@/components/lib/date-picker';
import { Note } from "@/components/ui/note";
import { formatDate, formatDbDate } from "@/lib/utils";
import { useAuth } from "@/lib/contexts";
import { useAppSelector } from "@/lib/redux/hooks";
import { RootState } from "@/lib/redux/store";
import { getAvailableDates, getMonthRange } from "@/lib/services/booking-service";
import { supabase } from "@/lib/supabase";
import { StartTimes } from "@/components/pages/booking/start-times";

export default function BookingDates() {
    const { client } = useAuth();
    const artist = useAppSelector((state: RootState) => state.artist.artist);

    const [sessionDates, setSessionDates] = useState<string[]>([]);
    const [sessionTimes, setSessionTimes] = useState<Record<string, string>>({});
    const [numberOfSessions, setNumberOfSessions] = useState<string>('1');
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [sessionLength] = useState<number>(120); // Default 2 hours for auto booking
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const loadAvailabilityForMonth = async (year: number, monthZeroBased: number) => {
        setLoadingAvailability(true);
        setAvailableDates([]);

        try {
            if (!artist?.id) return;
            // Use the main studio location (first location marked as is_main_studio, or first location)
            const mainLocation = artist?.locations?.find(loc => loc.is_main_studio) || artist?.locations?.[0];
            if (!mainLocation) return;

            const locationId = (mainLocation as any).id ?? mainLocation.place_id;
            const { start, end } = getMonthRange(year, monthZeroBased);
            const days = await getAvailableDates(artist as any, locationId, start, end);

            setAvailableDates(days);
        } catch (e) {
            console.warn('Failed to load availability:', e);
            setAvailableDates([]);
        } finally {
            setLoadingAvailability(false);
        }
    };

    const onChangeCalendarMonth = (year: number, month: number) => {
        setCalendarYear(year);
        setCalendarMonth(month);
    };

    const handleBack = () => {
        router.back();
    };

    const handleConfirmAppointments = async () => {
        if (!artist || !client || sessionDates.length === 0) {
            console.error('Missing required data for booking');
            return;
        }

        setIsSaving(true);
        setSaveSuccess(false);

        try {
            // Get the main location
            const mainLocation = artist.locations?.find(loc => loc.is_main_studio) || artist.locations?.[0];
            if (!mainLocation) {
                console.error('No location found');
                return;
            }

            const locationId = (mainLocation as any).id ?? mainLocation.place_id;

            // Calculate date range
            const sortedDates = [...sessionDates].sort();
            const dateRangeStart = sortedDates[0];
            const dateRangeEnd = sortedDates[sortedDates.length - 1];

            // Prepare the project request data
            const projectRequestData = {
                artist_id: artist.id,
                title: `Auto-booked tattoo session (${sessionDates.length} session${sessionDates.length > 1 ? 's' : ''})`,
                date_range_start: dateRangeStart,
                date_range_end: dateRangeEnd,
                location_id: locationId,
                session_count: parseInt(numberOfSessions) || sessionDates.length,
                session_length: sessionLength,
                session_rate: 0, // Default rate - can be updated later
                deposit_amount: 0, // Default deposit - can be updated later
                notes: null,
                selected_days: sessionDates,
                start_times: sessionTimes,
                source: "auto_booking",
                source_id: client.id, // Use client ID as source_id for now
            };

            console.log('Saving project request:', projectRequestData);

            const { data, error } = await supabase
                .from('project_requests')
                .insert(projectRequestData)
                .select()
                .single();

            if (error) {
                console.error('Error saving project request:', error);
                // You might want to show a toast or error message here
                return;
            }

            console.log('Project request saved successfully:', data);

            // Show success state
            setSaveSuccess(true);

        } catch (error) {
            console.error('Unexpected error saving project request:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Load availability when artist or calendar changes
    useEffect(() => {
        loadAvailabilityForMonth(calendarYear, calendarMonth);
    }, [artist?.id, calendarYear, calendarMonth]);

    // Trim selected dates if user reduces the number of sessions
    useEffect(() => {
        const maxSessions = parseInt(numberOfSessions) || 1;
        if (sessionDates.length > maxSessions) {
            const trimmedDates = sessionDates.slice(0, maxSessions);
            setSessionDates(trimmedDates);

            // Also clean up session times for removed dates
            const newSessionTimes: Record<string, string> = {};
            trimmedDates.forEach(date => {
                if (sessionTimes[date]) {
                    newSessionTimes[date] = sessionTimes[date];
                }
            });
            setSessionTimes(newSessionTimes);
        }
    }, [numberOfSessions, sessionDates.length]);

    // Save booking when modal opens
    useEffect(() => {
        if (isModalVisible && !isSaving && !saveSuccess) {
            handleConfirmAppointments();
        }
    }, [isModalVisible]);

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <ClientHeader
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                />
                <View className="flex-1 pt-2 pb-4 gap-6">
                    <KeyboardAwareScrollView bottomOffset={50} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                        <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                            <View className="items-center justify-center" style={{ height: 120 }}>
                                <Image
                                    source={require('@/assets/images/icons/appointment.png')}
                                    style={{ width: 56, height: 56 }}
                                    resizeMode="contain"
                                />
                                <Text variant="h6" className="text-center uppercase">pick your</Text>
                                <Text variant="h6" className="text-center uppercase leading-none">dates</Text>
                            </View>


                            <Text variant="h4">Tap to Select Your Dates</Text>

                            <View className="gap-2 flex-row items-center justify-between">
                                <Text variant="h5">Number of Sessions</Text>
                                <View>
                                    <Input
                                        className="h-8"
                                        style={{ width: 80 }}
                                        value={numberOfSessions}
                                        onChangeText={setNumberOfSessions}
                                        keyboardType="numeric"
                                        maxLength={2}
                                    />
                                </View>
                            </View>

                            <Note message="Back to back sessions are available for your project!" />

                            <View className="relative">
                                {loadingAvailability && (
                                    <View className="absolute top-16 right-1 bottom-1 left-1 bg-background/50 z-10 items-center justify-center rounded-lg">
                                        <ActivityIndicator size="small" color="#ffffff" />
                                        <Text className="text-text-secondary mt-2 text-sm">Checking availability...</Text>
                                    </View>
                                )}
                                {!loadingAvailability && availableDates.length === 0 && (
                                    <View className="absolute top-16 right-1 bottom-1 left-1 bg-background/50 z-10 items-center justify-center rounded-lg">
                                        <Text className="text-text-secondary mt-2 text-sm">No availability found</Text>
                                    </View>
                                )}
                                <DatePicker
                                    selectedDatesStrings={sessionDates}
                                    onDatesStringSelect={setSessionDates}
                                    showInline={true}
                                    selectionMode="multiple"
                                    maxSelections={parseInt(numberOfSessions) || 1}
                                    availableDates={availableDates}
                                    onMonthChange={(y, m) => onChangeCalendarMonth(y, m)}
                                    className="bg-background-secondary rounded-lg p-2"
                                />
                            </View>

                            {sessionDates.length > 0 && artist && (
                                <View className="gap-4">
                                    <View className="gap-2">
                                        <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                            {sessionDates.length === 1
                                                ? `Selected date - ${formatDbDate(sessionDates[0], 'MMM DD, YYYY')}`
                                                : `${sessionDates.length} dates selected`
                                            }
                                        </Text>
                                    </View>
                                    <View className="gap-4">
                                        {sessionDates.map((date) => {
                                            return (
                                                <View key={date} className="gap-2">
                                                    <Text variant="h5" className="text-foreground">
                                                        {formatDbDate(date, 'MMM DD, YYYY')}
                                                    </Text>
                                                    <StartTimes
                                                        date={date}
                                                        sessionLength={sessionLength}
                                                        breakTime={30}
                                                        artist={artist}
                                                        locationId={(artist?.locations?.find(loc => loc.is_main_studio) || artist?.locations?.[0] as any)?.id ?? (artist?.locations?.find(loc => loc.is_main_studio) || artist?.locations?.[0])?.place_id}
                                                        selectedTime={sessionTimes[date]}
                                                        onTimeSelect={(date: string, time: string) => setSessionTimes(prev => ({ ...prev, [date]: time }))}
                                                    />
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            <View className="gap-3">
                                <Button size="lg" className="w-full" onPress={() => setIsModalVisible(true)}>
                                    <Text>Confirm Appointments</Text>
                                </Button>
                                <Text className="text-center text-text-secondary text-xs">Confirm your dates to temporarily hold your spot, then send your deposit below.</Text>
                            </View>

                            <View className="gap-3">
                                <Text variant="h5">Ways to pay your deposit</Text>
                                <View className="gap-4">
                                    <View className="gap-4 flex-row items-center justify-between">
                                        <View>
                                            <Text variant="h5">Credit Card:</Text>
                                        </View>
                                        <View className="w-[180px]">
                                            <Button variant="outline" className="h-8 p-0">
                                                <Text className="text-xs py-2 px-3">Pay with Stripe/Square</Text>
                                            </Button>
                                        </View>
                                    </View>
                                    <View className="gap-4 flex-row items-start justify-between">
                                        <View>
                                            <Text variant="h5">E-Transfer:</Text>
                                            <Text variant="small" className="text-text-secondary">Canada Only</Text>
                                        </View>
                                        <View className="w-[180px]">
                                            <Button variant="outline" className="h-8 p-0">
                                                <Text className="text-xs py-2 px-3">Email or phone number</Text>
                                            </Button>
                                        </View>
                                    </View>
                                    <View className="gap-4 flex-row items-center justify-between">
                                        <View>
                                            <Text variant="h5">Paypal:</Text>
                                        </View>
                                        <View className="w-[180px] flex-row gap-2">
                                            <Button variant="outline" className="h-8 p-0">
                                                <Text className="text-xs py-2 px-3">Paypal Link</Text>
                                            </Button>
                                            
                                            <Button variant="outline" className="w-[70px] h-8 p-0">
                                                <Text className="text-xs py-2 px-3">Email</Text>
                                            </Button>
                                        </View>
                                    </View>
                                    <View className="gap-4 flex-row items-start justify-between">
                                        <View>
                                            <Text variant="h5">Venmo:</Text>
                                            <Text variant="small" className="text-text-secondary">US Only</Text>
                                        </View>
                                        <View className="w-[180px]">
                                            <Button variant="outline" className="h-8 p-0">
                                                <Text className="text-xs py-2 px-3">Email or phone number</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </SafeAreaView>

            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <Pressable
                    className="flex-1 justify-center items-center bg-black/50 px-4"
                    onPress={() => setIsModalVisible(false)}
                >
                    <Pressable
                        className="bg-background-secondary rounded-2xl p-6 m-4 max-w-sm w-full"
                        onPress={() => {}} // Prevent event bubbling
                    >
                        {/* {isSaving ? (
                            <>
                                <ActivityIndicator size="large" color="#ffffff" />
                                <Text className="text-center mt-4" variant="h4">Saving your appointment...</Text>
                            </>
                        ) : saveSuccess ? (
                            <>
                                <Text className="text-center" variant="h4">✅ Booking Confirmed!</Text>
                                <Text className="text-center mt-2" variant="default">Your spot has been reserved. Please send your deposit to secure it.</Text>
                                <View className="mt-4 w-full">
                                    <Button
                                        className="w-full"
                                        onPress={() => {
                                            setIsModalVisible(false);
                                            setSaveSuccess(false);
                                            router.back();
                                        }}
                                    >
                                        <Text>Continue</Text>
                                    </Button>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text className="text-center" variant="h4">Your spot is on hold!</Text>
                                <Text className="text-center mt-2" variant="default">Please send your deposit to secure it.</Text>
                            </>
                        )} */}
                        <Text className="text-center" variant="h4">Your spot is on hold!</Text>
                        <Text className="text-center mb-4" variant="h4">Please send your deposit to secure it</Text>
                        {/* <View className="mt-4 w-full">
                            <Button
                                className="w-full"
                                onPress={() => {
                                    setIsModalVisible(false);
                                    setSaveSuccess(false);
                                    router.back();
                                }}
                            >
                                <Text>Continue</Text>
                            </Button>
                        </View> */}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}