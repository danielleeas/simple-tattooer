import React from 'react';
import { View, Modal, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

interface DepositPolicyModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function DepositPolicyModal({ visible, onClose }: DepositPolicyModalProps) {
    const artist = useSelector((state: RootState) => state.artist.artist);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-background">
                <Pressable
                    className="absolute top-4 right-4 z-10 p-2"
                    onPress={onClose}
                >
                    <Icon as={X} size={24} />
                </Pressable>

                <View className="flex-1 p-6 gap-6 pt-16">
                    <Text variant="h3" className="text-center">Deposit Policy</Text>

                    <KeyboardAwareScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    >
                        <Text className="text-text-secondary leading-6">
                            {artist?.rule?.deposit_policy || 'No deposit policy has been set by the artist yet.'}
                        </Text>
                    </KeyboardAwareScrollView>
                </View>
            </View>
        </Modal>
    );
}
