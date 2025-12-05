import { router, Stack } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "@/components/lib/Header";
import { View, Image, Pressable, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { Input } from "@/components/ui/input";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, useToast } from "@/lib/contexts";
import { Locations as ArtistLocation } from "@/lib/redux/types";
import { updateBookingQuestions } from "@/lib/services/setting-service";
import { useDispatch } from "react-redux";
import { setArtist } from "@/lib/redux/slices/auth-slice";
import PLUS_THIN_IMAGE from "@/assets/images/icons/plus_thin.png";

const coverupOptions = [
    { label: 'Coverup', value: 'coverup' },
    { label: 'Add on', value: 'add_on' },
    { label: 'Between existing tattoos', value: 'between_existing_tattoos' },
]

export default function BookingFormScreen() {
    const { artist } = useAuth();
    const { toast } = useToast();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();

    const [location, setLocation] = useState<string>('');
    const [coverup, setCoverup] = useState<string>('');
    const [preferredDay, setPreferredDay] = useState<string>('');
    const [isDepositNonRefundable, setIsDepositNonRefundable] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [questionOne, setQuestionOne] = useState<string>(artist?.rule?.question_one || '');
    const [questionTwo, setQuestionTwo] = useState<string>(artist?.rule?.question_two || '');
    const [updatingQuestions, setUpdatingQuestions] = useState(false);

    const handleBack = () => {
        router.back();
    };

    const handleEditBookingForm = () => {
        // Sync questions with current artist data when opening modal
        setQuestionOne(artist?.rule?.question_one || '');
        setQuestionTwo(artist?.rule?.question_two || '');
        setIsModalOpen(true);
    };

    const handleUpdateQuestions = async () => {
        setUpdatingQuestions(true);
        try {
            if (!artist?.id) {
                throw new Error('Artist ID not found. Please sign in again.');
            }

            const result = await updateBookingQuestions(artist.id, {
                questionOne: questionOne,
                questionTwo: questionTwo,
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to update questions');
            }

            // Update artist state with new questions
            if (artist) {
                dispatch(setArtist({
                    ...artist,
                    rule: {
                        ...artist.rule,
                        question_one: questionOne,
                        question_two: questionTwo,
                    },
                }));
            }

            setIsModalOpen(false);
            setTimeout(() => {
                toast({
                    variant: 'success',
                    title: 'Questions updated successfully.',
                    duration: 2000,
                });
            }, 300);
        } catch (error) {
            setTimeout(() => {
                toast({
                    variant: 'error',
                    title: error instanceof Error ? error.message : 'Something went wrong.',
                    duration: 3000,
                });
            }, 300);
        } finally {
            setUpdatingQuestions(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                />
                <View className="flex-1 pt-2 pb-4 gap-6">
                    <View className="flex-1">
                        <KeyboardAwareScrollView
                            bottomOffset={50}
                            contentContainerClassName="w-full"
                            showsVerticalScrollIndicator={false}
                            
                        >
                            <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                                <View className="items-center justify-center" style={{ height: 180 }}>
                                    <Image
                                        source={require('@/assets/images/icons/portfolio.png')}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">[Artist name] —</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Booking Form</Text>
                                    <Text className="text-center mt-2 text-text-secondary">I’m  happy you’re here!  Please fill out this</Text>
                                    <Text className="text-center text-text-secondary leading-none">short form so we can get  started.</Text>
                                </View>

                                <Button variant="outline" onPress={handleEditBookingForm}>
                                    <Text>Edit Booking/Consult Form</Text>
                                </Button>

                                <View className="gap-2">
                                    <Text variant="h5">Full Name</Text>
                                    <Input />
                                    <Text className="text-text-secondary">First and last, please</Text>
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Email</Text>
                                    <Input />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Phone Number</Text>
                                    <Input />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">City & Country of Residence</Text>
                                    <Input />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Tattoo Booking Location</Text>
                                    <DropdownPicker
                                        options={artist?.locations?.map((location: ArtistLocation) => ({ label: location.address, value: location.address })) || []}
                                        value={location}
                                        onValueChange={(value: string) => setLocation(value)}
                                        placeholder="Select location"
                                        modalTitle="Select Location"
                                    />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Preferred days</Text>
                                    <RadioGroup value={preferredDay} onValueChange={(value) => setPreferredDay(value)}>
                                        <Pressable onPress={() => setPreferredDay('Any')} className="flex-row items-center gap-2">
                                            <RadioGroupItem value="Any" id="monday" />
                                            <Text>Any</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setPreferredDay('Weekdays')} className="flex-row items-center gap-2">
                                            <RadioGroupItem value="Weekdays" id="tuesday" />
                                            <Text>Weekdays</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setPreferredDay('Weekend')} className="flex-row items-center gap-2">
                                            <RadioGroupItem value="Weekend" id="wednesday" />
                                            <Text>Weekend</Text>
                                        </Pressable>
                                    </RadioGroup>
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Please Tell Me Your Tattoo Idea</Text>
                                    <Textarea className="min-h-28" placeholder="Please include size, placement,  colour, or black & grey." />
                                </View>

                                {artist?.rule?.question_one && (
                                    <View className="gap-2">
                                        <Text variant="h5">{artist?.rule?.question_one}</Text>
                                        <Textarea placeholder="Type your question here" />
                                    </View>
                                )}

                                {artist?.rule?.question_two && (
                                    <View className="gap-2">
                                        <Text variant="h5">{artist?.rule?.question_two}</Text>
                                        <Textarea placeholder="Type your question here" />
                                    </View>
                                )}

                                <View className="gap-2">
                                    <Text variant="h5">Is this a coverup/add on/or between existing tattoos (please include photo)</Text>
                                    <DropdownPicker
                                        options={coverupOptions?.map((option: { label: string; value: string }) => ({ label: option.label, value: option.value }))}
                                        value={coverup}
                                        onValueChange={(value: string) => setCoverup(value)}
                                        placeholder=""
                                        modalTitle=""
                                    />
                                </View>

                                <View className="flex-row items-center justify-start gap-4">
                                    <Text variant="h5">Upload Reference Photos (Max 5)</Text>
                                    <Image source={require('@/assets/images/icons/camera.png')} style={{ width: 32, height: 32 }} />
                                </View>

                                <View className="gap-4">
                                    <View className="flex flex-row items-start gap-3">
                                        <Checkbox
                                            id="terms"
                                            className="mt-1"
                                            checked={isDepositNonRefundable}
                                            onCheckedChange={(checked) => setIsDepositNonRefundable(checked)}
                                        />
                                        <Text
                                            className='flex-1 tracking-wider'
                                            onPress={() => setIsDepositNonRefundable(!isDepositNonRefundable)}
                                        >
                                            I understand that deposits are non - refundable.
                                        </Text>
                                    </View>

                                    <View className="flex flex-row items-start gap-3">
                                        <Checkbox
                                            id="terms"
                                            className="mt-1"
                                            checked={isDepositNonRefundable}
                                            onCheckedChange={(checked) => setIsDepositNonRefundable(checked)}
                                        />
                                        <Text
                                            className='flex-1 tracking-wider'
                                            onPress={() => setIsDepositNonRefundable(!isDepositNonRefundable)}
                                        >
                                            I am of legal age to get tattooed
                                        </Text>
                                    </View>

                                    <View className="flex flex-row items-start gap-3">
                                        <Checkbox
                                            id="terms"
                                            className="mt-1"
                                            checked={isDepositNonRefundable}
                                            onCheckedChange={(checked) => setIsDepositNonRefundable(checked)}
                                        />
                                        <Text
                                            className='flex-1 tracking-wider'
                                            onPress={() => setIsDepositNonRefundable(!isDepositNonRefundable)}
                                        >
                                            I agree to the studio's Artist's Policies and Privacy Policy.
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </View>
            </SafeAreaView>

            <Modal
                visible={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                transparent={true}
                animationType="slide"
            >
                <View className="flex-1 bg-black/50 justify-end items-center">
                    <View className="relative w-full h-full bg-background gap-6" style={{ paddingTop: insets.top }}>
                        <View className="w-full h-20 flex-row items-center justify-between px-4 py-4">
                            <Pressable onPress={() => setIsModalOpen(false)} className="items-center justify-center ">
                                <Image source={require('@/assets/images/icons/arrow_left.png')} style={{ width: 24, height: 24 }} />
                                <Text className="text-xs uppercase" style={{ lineHeight: 14 }}>Back</Text>
                            </Pressable>
                        </View>
                        <View className="flex-1 bg-background px-4 pt-2 gap-6 pb-6">
                            <View className="flex-1">
                                <KeyboardAwareScrollView
                                    bottomOffset={20}
                                    contentContainerClassName="w-full"
                                    showsVerticalScrollIndicator={false}
                                    

                                >
                                    <View className="gap-6">
                                        <View className="items-center justify-center pb-9">
                                            <Image
                                                source={PLUS_THIN_IMAGE}
                                                style={{ width: 56, height: 56 }}
                                                resizeMode="contain"
                                            />
                                            <Text variant="h6" className="text-center uppercase">Add question</Text>
                                        </View>

                                        <View className="gap-2">
                                            <Text variant="h5">Question 1</Text>
                                            <Textarea
                                                editable={!updatingQuestions}
                                                placeholder="Type your message here."
                                                value={questionOne}
                                                onChangeText={(text) => setQuestionOne(text)}
                                            />
                                        </View>
                                        <View className="gap-2">
                                            <Text variant="h5">Question 2</Text>
                                            <Textarea
                                                editable={!updatingQuestions}
                                                placeholder="Type your message here."
                                                value={questionTwo}
                                                onChangeText={(text) => setQuestionTwo(text)}
                                            />
                                        </View>

                                        <View className="gap-3">
                                            <Button variant='outline' onPress={handleUpdateQuestions} disabled={updatingQuestions}>
                                                <Text variant='h5'>{updatingQuestions ? "Updating..." : "Add to Booking Form"}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </KeyboardAwareScrollView>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}