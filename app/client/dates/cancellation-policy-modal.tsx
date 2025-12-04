import React from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import CustomModal from '@/components/lib/custom-modal';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

interface CancellationPolicyModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function CancellationPolicyModal({ visible, onClose }: CancellationPolicyModalProps) {
    const artist = useSelector((state: RootState) => state.artist.artist);

    return (
        <CustomModal
            visible={visible}
            onClose={onClose}
            variant="center"
            className="bg-background"
        >
            <View className="p-6 gap-6">
                <Text variant="h3" className="text-center">Cancellation Policy</Text>

                <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    <Text className="text-text-secondary leading-6">
                        {artist?.rule?.cancellation_policy || 'No cancellation policy has been set by the artist yet.'}
                    </Text>
                </KeyboardAwareScrollView>
            </View>
        </CustomModal>
    );
}
