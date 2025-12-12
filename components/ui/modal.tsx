import React from 'react';
import { Modal as RNModal, View, Pressable, StyleSheet } from 'react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  transparent?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
}

export function Modal({
  visible,
  onClose,
  children,
  transparent = true,
  animationType = 'fade',
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
        />
        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    width: '90%',
    maxWidth: 500,
    zIndex: 1,
  },
});
