import { View, Modal, Pressable, Image } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Text } from "@/components/ui/text"
import { PolicyDataProps } from "./type";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/icon";
import { X } from "lucide-react-native";
import { FilePicker } from "@/components/lib/file-picker";

import PLUS_THIN_IMAGE from "@/assets/images/icons/plus_thin.png";
import { useAuth, useToast } from "@/lib/contexts";
import { updateBookingQuestions } from "@/lib/services/setting-service";
import { Collapse } from "@/components/lib/collapse";

interface PolicyProps {
    policyData: PolicyDataProps;
    updatePolicyData: (updates: Partial<PolicyDataProps>) => void;
}

export const Policy = ({ policyData, updatePolicyData }: PolicyProps) => {
    const insets = useSafeAreaInsets();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updatingQuestions, setUpdatingQuestions] = useState(false);
    const { artist } = useAuth();
    const { toast } = useToast();

    const handleUpdateQuestions = async () => {
        setUpdatingQuestions(true);
        try {
            if (!artist?.id) {
                throw new Error('Artist ID not found. Please sign in again.');
            }

            const result = await updateBookingQuestions(artist.id, {
                questionOne: policyData.questionOne,
                questionTwo: policyData.questionTwo,
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to update questions');
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
    }

    return (
        <View className="gap-6 mt-4">
            <Button onPress={() => setIsModalOpen(true)} variant="outline">
                <Text>Edit Booking/Consult Form</Text>
            </Button>

            <View className="gap-2">
                <Collapse title="Deposit policy text for emails" textClassName="text-xl">
                    <Textarea className='min-h-28' value={policyData.questionOne || ''} onChangeText={(text) => updatePolicyData({ questionOne: text })} />
                </Collapse>
            </View>

            <View className="gap-2">
                <Collapse title="Cancellation policy text for emails" textClassName="text-xl">
                    <Textarea className='min-h-28' value={policyData.questionTwo || ''} onChangeText={(text) => updatePolicyData({ questionTwo: text })} />
                </Collapse>
            </View>

            <View className="gap-2">
                <Collapse title="Reschedule policy text for emails" textClassName="text-xl">
                    <Textarea className='min-h-28' value={policyData.reschedulePolicy || ''} onChangeText={(text) => updatePolicyData({ reschedulePolicy: text })} />
                </Collapse>
            </View>

            <View className="gap-2">
                <Text variant="h5">Waiver Text</Text>
                <FilePicker
                    onFileSelected={(file) => updatePolicyData({ waiverText: file.uri })}
                    onFileRemoved={() => updatePolicyData({ waiverText: '' })}
                    placeholder="Choose File"
                    helperText="Upload your standard waiver here (PDF or clear image file)."
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    allowedFileTypes={['image/*', 'application/pdf']}
                    initialFile={policyData.waiverText ? { uri: policyData.waiverText, name: policyData.waiverText.split('/').pop() || '', type: 'application/pdf', size: policyData.waiverText.length } : null}
                />
            </View>

            <View className="gap-2">
                <Text variant="h5">Privacy Policy</Text>
                <FilePicker
                    onFileSelected={(file) => updatePolicyData({ privacyPolicy: file.uri })}
                    onFileRemoved={() => updatePolicyData({ privacyPolicy: '' })}
                    placeholder="Choose File"
                    helperText="Upload privacy policy here"
                    secondHelperText="(PDF or clear image file)."
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    allowedFileTypes={['image/*', 'application/pdf']}
                    initialFile={policyData.privacyPolicy ? { uri: policyData.privacyPolicy, name: policyData.privacyPolicy.split('/').pop() || '', type: 'application/pdf', size: policyData.privacyPolicy.length } : null}
                />
            </View>

            <View className="gap-2">
                <Text variant="h5">Artist's Policies</Text>
                <FilePicker
                    onFileSelected={(file) => updatePolicyData({ termsOfCondition: file.uri })}
                    onFileRemoved={() => updatePolicyData({ termsOfCondition: '' })}
                    placeholder="Choose File"
                    helperText="Upload terms & condition here"
                    secondHelperText="(PDF or clear image file)."
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    allowedFileTypes={['image/*', 'application/pdf']}
                    initialFile={policyData.termsOfCondition ? { uri: policyData.termsOfCondition, name: policyData.termsOfCondition.split('/').pop() || '', type: 'application/pdf', size: policyData.termsOfCondition.length } : null}
                />
            </View>

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
                                    keyboardShouldPersistTaps="handled"

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
                                                value={policyData.questionOne}
                                                onChangeText={(text) => updatePolicyData({ questionOne: text })}
                                            />
                                        </View>
                                        <View className="gap-2">
                                            <Text variant="h5">Question 2</Text>
                                            <Textarea
                                                editable={!updatingQuestions}
                                                placeholder="Type your message here."
                                                value={policyData.questionTwo}
                                                onChangeText={(text) => updatePolicyData({ questionTwo: text })}
                                            />
                                        </View>

                                        <View className="gap-3">
                                            <Button size="lg" onPress={handleUpdateQuestions} disabled={updatingQuestions}>
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
        </View>
    )
}