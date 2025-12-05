import { useState } from "react";
import { View, Image, Pressable } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { TimeDurationPicker } from '@/components/lib/time-duration-picker';
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, DollarSignIcon } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { DateInput } from "@/components/lib/date-input";
import { Locations as ArtistLocation } from "@/lib/redux/types";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import { Input } from "@/components/ui/input";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { useAuth, useToast } from "@/lib/contexts";

export default function AutoBooking() {
    const { toast } = useToast();
    const { artist } = useAuth();
    const { clientId } = useLocalSearchParams();
    const [dateRangeOpened, setDateRangeOpened] = useState<boolean>(false);
    const [sessionDurationColOpened, setSessionDurationColOpened] = useState<boolean>(false);
    const [locationColOpened, setLocationColOpened] = useState<boolean>(false);
    const [sessionDuration, setSessionDuration] = useState<number | undefined>(undefined);
    const [location, setLocation] = useState<string>('');
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [sessionCount, setSessionCount] = useState<string | "">("");

    const [project, setProject] = useState<any>(null);


    const handleBack = () => {
        router.back();
    };

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    const handleCompleteBooking = () => {
        router.push('/');
        toast({
            variant: 'success',
            title: 'Booking Created!',
            description: 'Waiting for client response to pay deposit',
            duration: 3000,
        });
    };

    return (
        <>
            <Stack.Screen options={{headerShown: false, animation: 'slide_from_right'}} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={HOME_IMAGE}
                    leftButtonTitle="Home"
                    onLeftButtonPress={handleBack}
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
                            <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false}>
                                <View className="gap-6 pb-6">
                                    <View className="items-center justify-center pb-[22px] h-[180px]">
                                        <Image
                                            source={require('@/assets/images/icons/appointment.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Create</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Quote</Text>
                                        <Text className="text-center mt-2 text-text-secondary">Set the parameters</Text>
                                        <Text className="text-center text-text-secondary leading-none">for this project.</Text>
                                    </View>

                                    <View className="gap-2">
                                        <Text variant="h5">Project Title</Text>
                                        <Input
                                            value={sessionCount.toString()}
                                            onChangeText={() => { }}
                                        />
                                    </View>

                                    <View className="items-start gap-2">
                                        <Pressable className="w-full flex-row items-start justify-between" onPress={() => setDateRangeOpened(!dateRangeOpened)}>
                                            <View className="w-[318px] gap-2">
                                                <Text variant="h5">Date Range</Text>
                                                <Text className="text-text-secondary leading-5">Choose the date range this project should be booked within</Text>
                                            </View>
                                            <Icon as={dateRangeOpened ? ChevronUp : ChevronDown} size={20} />
                                        </Pressable>
                                        {dateRangeOpened && (
                                            <View className="flex-row items-center w-full gap-2">
                                                <View className="flex-1">
                                                    <DateInput
                                                        selectedDate={startDate}
                                                        onDateSelect={setStartDate}
                                                        placeholder="Select date"
                                                        dateFormat="MM DD"
                                                        modalTitle="Select Start Date"
                                                        showCalendarIcon={false}
                                                    />
                                                </View>
                                                <Text variant="h5">-</Text>
                                                <View className="flex-1">
                                                    <DateInput
                                                        selectedDate={endDate}
                                                        onDateSelect={setEndDate}
                                                        placeholder="Select date"
                                                        dateFormat="MM DD"
                                                        modalTitle="Select End Date"
                                                        showCalendarIcon={false}
                                                    />
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    <View className="items-start gap-2">
                                        <Pressable className="w-full flex-row items-center justify-between" onPress={() => setLocationColOpened(!locationColOpened)}>
                                            <Text variant="h5">Location</Text>
                                            <Icon as={locationColOpened ? ChevronUp : ChevronDown} size={20} />
                                        </Pressable>
                                        {locationColOpened && (
                                            <View className="gap-2 w-full">
                                                <DropdownPicker
                                                    options={artist?.locations?.map((location: ArtistLocation) => ({ label: location.address, value: (location as any).id ?? (location as any).place_id })) || []}
                                                    value={location}
                                                    onValueChange={setLocation}
                                                    placeholder="Select location"
                                                    modalTitle="Select Location"
                                                />
                                            </View>
                                        )}
                                    </View>

                                    <View className="flex-row items-center gap-2">
                                        <View className="flex-1 gap-2">
                                            <Text variant="h5" className="w-[200px]">How Many Sessions Will This Take?</Text>
                                        </View>
                                        <View className="w-20">
                                            <Input value={sessionCount.toString()} />
                                        </View>
                                    </View>

                                    <View className="items-start gap-2">
                                        <Pressable className="w-full flex-row items-center justify-between" onPress={() => setSessionDurationColOpened(!sessionDurationColOpened)}>
                                            <Text variant="h5">How Long Is Each Session?</Text>
                                            <Icon as={sessionDurationColOpened ? ChevronUp : ChevronDown} size={20} />
                                        </Pressable>
                                        {sessionDurationColOpened && (
                                            <View className="gap-2 w-full">
                                                <TimeDurationPicker
                                                    selectedDuration={sessionDuration}
                                                    onDurationSelect={(duration) => setSessionDuration(duration)}
                                                    minuteInterval={15}
                                                    minDuration={15}
                                                    maxDuration={525}
                                                    modalTitle="Select Session Duration"
                                                />
                                            </View>
                                        )}
                                    </View>

                                    <View className="flex-row items-center justify-between gap-3">
                                        <View className="flex-1 gap-2">
                                            <Text variant="h5">Deposit Amount</Text>
                                            <Input value={project?.deposit.amount.toString()} leftIcon={DollarSignIcon} />
                                        </View>
                                        <View className="flex-1 gap-2">
                                            <Text variant="h5">Session rate</Text>
                                            <Input value={project?.sessions[0]?.rate.toString()} leftIcon={DollarSignIcon} />
                                        </View>
                                    </View>

                                    <View className="gap-2">
                                        <Textarea
                                            placeholder="Project Notes"
                                            className="min-h-28"
                                        />
                                        <Text variant="small" className="font-thin leading-5 text-text-secondary">These  notes  will  be  sent  to  the  client</Text>
                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>

                        <View className="gap-4 items-center justify-center">
                            <Button onPress={handleCompleteBooking} size="lg" className="w-full">
                                <Text variant='h5'>Send Quote & Deposit</Text>
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
