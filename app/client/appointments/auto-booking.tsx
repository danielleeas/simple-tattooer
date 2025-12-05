import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientHeader from "@/components/lib/client-header";
import { View, Image, Pressable, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { FileSearch, FileText } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from '@/components/lib/date-picker';
import { Note } from "@/components/ui/note";
import { formatDate } from "@/lib/utils";

export default function BookingDates() {
    const [sessionDates, setSessionDates] = useState<string[]>([]);
    const [sessionTime, setSessionTime] = useState<string | undefined>();
    const [numberOfSessions, setNumberOfSessions] = useState<string>('1');
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

    const timeRangesChunks = [
        [{ value: '09:15 AM', label: '09:15 AM' }, { value: '10:00 AM', label: '10:00 AM' }],
        [{ value: '11.30 AM', label: '11.30 AM' }, { value: '01.45 PM', label: '01.45 PM' }],
        [{ value: '03.30 PM', label: '03.30 PM' }, { value: '05.00 PM', label: '05.00 PM' }]
    ]

    const handleBack = () => {
        router.back();
    };

    // Trim selected dates if user reduces the number of sessions
    useEffect(() => {
        const maxSessions = parseInt(numberOfSessions) || 1;
        if (sessionDates.length > maxSessions) {
            setSessionDates(sessionDates.slice(0, maxSessions));
        }
    }, [numberOfSessions, sessionDates.length]);

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
                                <Text variant="h5">Date Range</Text>
                                <Text variant="h5">Aug 1-10, 2025</Text>
                            </View>

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

                            <DatePicker
                                selectedDatesStrings={sessionDates}
                                onDatesStringSelect={setSessionDates}
                                showInline={true}
                                selectionMode="multiple"
                                maxSelections={parseInt(numberOfSessions) || 1}
                                className="bg-background-secondary rounded-lg p-2"
                            />

                            <View className="gap-3">
                                <Text variant="h5">
                                    Selected Dates ({sessionDates.length}/{numberOfSessions}) -{' '}
                                    {sessionDates.length > 0
                                        ? sessionDates.map(date => formatDate(date, false, true)).join(', ')
                                        : 'None'
                                    }
                                </Text>
                                <View className="gap-2">
                                    {timeRangesChunks.map((rages, index) => (
                                        <View key={index} className="gap-2 flex-row items-center justify-between">
                                            {rages.map((time, index1) => (
                                                <Button onPress={() => setSessionTime(time.value)} key={index1} variant={sessionTime === time.value ? 'default' : 'outline'} className="flex-1 h-8 p-0">
                                                    <Text>{time.label}</Text>
                                                </Button>
                                            ))}
                                        </View>
                                    ))}
                                </View>
                            </View>

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
                        <Text className="text-center" variant="h4">Your spot is on hold!</Text>
                        <Text className="text-center mb-4" variant="h4">Please send your deposit to secure it</Text>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}