import React from 'react';
import { View, ActivityIndicator, Modal } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function LoadingOverlay({ 
  visible, 
  message = 'Loading...', 
  title,
  subtitle,
  className
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className={cn("w-full bg-background-secondary rounded-lg p-8 mx-6 items-center min-w-[280px]", className)}>
          <ActivityIndicator 
            size="large" 
            color="#fff" 
            className="mb-4"
          />
          {title && (
            <Text variant="h3" className="text-foreground mb-2 text-center">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className="text-text-secondary text-center">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
