import React, { useState } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CustomModal from '@/components/lib/custom-modal';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { useToast } from '@/lib/contexts/toast-context';
import { router } from 'expo-router';

interface RescheduleModalProps {
    visible: boolean;
    onClose: () => void;
    sessionDate?: string;
    onDateSelect?: (date: string) => void;
    onOpenDepositPolicy?: () => void;
    onOpenCancellationPolicy?: () => void;
}

export default function RescheduleModal({
    visible,
    onClose,
    sessionDate,
    onDateSelect,
    onOpenDepositPolicy,
    onOpenCancellationPolicy
}: RescheduleModalProps) {
    const artist = useSelector((state: RootState) => state.artist.artist);
    const { toast } = useToast();
    const [rescheduleMessage, setRescheduleMessage] = useState<string>('');

    const handleContinue = () => {
        // Handle reschedule logic here
        onClose();

        setTimeout(() => {
            router.push('/client/dashboard' as any);
            toast({
                variant: 'success',
                title: 'Reschedule request sent!',
                description: "We'll inform the artist of your request. Thank you for your patience!",
                duration: 3000,
            });
        }, 500);
    };

    // Mock date ranges for demonstration
    const dayRangesChunks = [
        [{ value: '2025-08-02', label: 'Aug 2, 2025' }, { value: '2025-10-08', label: 'Oct 8, 2025' }],
        [{ value: '2025-09-05', label: 'Sept 5, 2025' }]
    ];

    return (
        <CustomModal
            visible={visible}
            onClose={onClose}
            variant="bottom-sheet"
            className="bg-background-secondary"
        >
            <View className="p-6 gap-6">
                <Text variant="h4">Why do you want to reschedule?</Text>

                <Text className="text-text-secondary text-sm leading-5">
                    Read our{' '}
                    <Text
                        className="underline text-text-secondary"
                        onPress={onOpenDepositPolicy}
                    >
                        Deposit Policy
                    </Text>
                    {' '}or{' '}
                    <Text
                        className="underline text-text-secondary"
                        onPress={onOpenCancellationPolicy}
                    >
                        Cancellation Policy
                    </Text>
                </Text>

                <Textarea
                    placeholder="Type your message here"
                    className="min-h-28 w-full"
                    value={rescheduleMessage}
                    onChangeText={setRescheduleMessage}
                />

                <Text variant="h5">Choose a new date:</Text>

                <View className="gap-2">
                    {dayRangesChunks.map((ranges, index) => (
                        <View key={index} className="gap-2 flex-row items-center justify-between">
                            {ranges.map((day) => (
                                <Button
                                    key={day.value}
                                    onPress={() => onDateSelect?.(day.value)}
                                    variant={sessionDate === day.value ? 'default' : 'outline'}
                                    className="flex-1"
                                >
                                    <Text>{day.label}</Text>
                                </Button>
                            ))}
                        </View>
                    ))}
                </View>

                <View className="flex-row gap-3 pt-4">
                    <View className="flex-1">
                        <Button onPress={onClose} variant="outline">
                            <Text>Cancel</Text>
                        </Button>
                    </View>
                    <View className="flex-1">
                        <Button onPress={handleContinue}>
                            <Text>Continue</Text>
                        </Button>
                    </View>
                </View>
            </View>
        </CustomModal>
    );
}
