import React, { useState } from 'react';
import { View, Modal, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { useToast } from '@/lib/contexts/toast-context';
import { router } from 'expo-router';

interface CancellationModalProps {
    visible: boolean;
    onClose: () => void;
    onOpenDepositPolicy?: () => void;
    onOpenCancellationPolicy?: () => void;
}

export default function CancellationModal({
    visible,
    onClose,
    onOpenDepositPolicy,
    onOpenCancellationPolicy
}: CancellationModalProps) {
    const artist = useSelector((state: RootState) => state.artist.artist);
    const { toast } = useToast();
    const [cancelMessage, setCancelMessage] = useState<string>('');

    const handleContinue = () => {
        // Handle cancellation logic here
        onClose();

        setTimeout(() => {
            router.dismissTo('/');
            toast({
                variant: 'success',
                title: 'Cancellation request sent!',
                description: "We'll inform the artist to select a new date that works for you. Thank you for your patience!",
                duration: 3000,
            });
        }, 500);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <Pressable
                    style={{ flex: 1 }}
                    onPress={onClose}
                />
                <View className="bg-background-secondary rounded-t-3xl p-6 gap-6">
                <Text variant="h4">Why do you want to cancel?</Text>

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
                    value={cancelMessage}
                    onChangeText={setCancelMessage}
                />

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
            </View>
        </Modal>
    );
}
