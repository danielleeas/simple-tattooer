import { useState } from "react";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientHeader from "@/components/lib/client-header";
import { View, Image, ImageBackground, Pressable } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { useToast } from "@/lib/contexts/toast-context";
import { WeekdayToggle } from "@/components/lib/weekday-toggle";
import { ChevronDown, ChevronUp } from "lucide-react-native";

const locations = [
    {
        name: 'Toronto, Canada',
    },
    {
        name: 'Vancouver, Canada',
    },
    {
        name: 'Montreal, Canada',
    },
    {
        name: 'Calgary, Canada',
    },
    {
        name: 'Ottawa, Canada',
    }
]

export default function JoinCancelList() {
    const { toast } = useToast();
    const [location, setLocation] = useState<string>('');
    const [sessionDate, setSessionDate] = useState<string | undefined>();
    const [workDays, setWorkDays] = useState<string[]>([]);
    const [time, setTime] = useState<string | undefined>();
    const [locationColOpened, setLocationColOpened] = useState<boolean>(false);
    const dayRangesChunks = [
        [{ value: '2025-08-02', label: 'Aug 2, 2025' }, { value: '2025-10-08', label: 'Oct 8, 2025' }],
        [{ value: '2025-09-05', label: 'Sept 5, 2025' }]
    ]

    const timesChunks = [
        { value: 'morning', label: 'Morning' },
        { value: 'afternoon', label: 'Afternoon' },
        { value: 'evening', label: 'Evening' },
        { value: 'any', label: 'Any' }
    ]

    const handleBack = () => {
        router.back();
    };

    const handleContinue = () => {
        router.dismissTo('/');
        toast({
            variant: 'success',
            title: 'Join cancellation list success!',
            description: 'We’ll notify you if a spot opens up.',
            duration: 3000,
        });
    }

    const handleToggleDay = (day: string) => {
        const newWorkDays = workDays.includes(day)
            ? workDays.filter(d => d !== day)
            : [...workDays, day];
        setWorkDays(newWorkDays);
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <ClientHeader
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={100}
                    enabled={true}
                >
                    <View className="flex-1 pt-2 pb-4 gap-6">
                        <View className="flex-1">
                            <KeyboardAwareScrollView bottomOffset={50} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                                    <View className="items-center justify-center" style={{ height: 120 }}>
                                        <Image
                                            source={require('@/assets/images/icons/smile.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Join the</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">cancellation list</Text>
                                    </View>

                                    <View className="gap-6">
                                        <View className="gap-2">
                                            <Text variant="h5">Pick the session you'd like to swap for an earlier one</Text>
                                            {dayRangesChunks.map((rages, index) => (
                                                <View key={index} className="gap-2 flex-row items-center justify-between">
                                                    {rages.map((day, index1) => (
                                                        <Button
                                                            onPress={() => setSessionDate(day.value)}
                                                            key={index1}
                                                            variant={sessionDate === day.value ? 'default' : 'outline'}
                                                            className="flex-1 h-8 p-0 max-w-[170px]">
                                                            <Text>{day.label}</Text>
                                                        </Button>
                                                    ))}
                                                </View>
                                            ))}
                                        </View>

                                        <View className="gap-2">
                                            <Text variant="h5">What days of the week work for you?</Text>
                                            <Text variant="small">Choose as many as you like</Text>
                                            <View className="gap-2">
                                                <WeekdayToggle
                                                    selectedDays={workDays}
                                                    onToggleDay={handleToggleDay}
                                                />
                                            </View>
                                        </View>

                                        <View className="gap-2">
                                            <Text variant="h5">What time of the day works for you?</Text>
                                            <View className="gap-2">
                                                <View className="gap-2 flex-row items-center justify-start">
                                                    {timesChunks.map((timeOption, index1) => (
                                                        <Button
                                                            onPress={() => setTime(timeOption.value)}
                                                            key={index1}
                                                            variant={time === timeOption.value ? 'default' : 'outline'}
                                                            className="h-8 px-3 py-0">
                                                            <Text>{timeOption.label}</Text>
                                                        </Button>
                                                    ))}
                                                </View>
                                            </View>
                                        </View>

                                        <View className="items-start gap-2">
                                            <Pressable className="w-full flex-row items-center justify-between" onPress={() => setLocationColOpened(!locationColOpened)}>
                                                <Text variant="h5" className="flex-1 max-w-[270px]">What location do you want to book at?</Text>
                                                <Icon as={locationColOpened ? ChevronUp : ChevronDown} size={32} />
                                            </Pressable>
                                            {locationColOpened && (
                                                <View className="gap-2 w-full">
                                                    <DropdownPicker
                                                        options={locations.map(location => ({ label: location.name, value: location.name }))}
                                                        value={location}
                                                        onValueChange={setLocation}
                                                        placeholder="Select location"
                                                        modalTitle="Select Location"
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                        <View className="gap-4 items-center justify-center px-4">
                            <Button size="lg" className="w-full" onPress={handleContinue}>
                                <Text>Add Me To The List!</Text>
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}