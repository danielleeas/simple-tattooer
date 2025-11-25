import React from 'react';
import { View, ActivityIndicator, Modal, Animated, Easing } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  title?: string;
  subtitle?: string;
  progress?: number;
  className?: string;
}

export function LoadingOverlay({ 
  visible, 
  message, 
  title,
  subtitle,
  progress,
  className
}: LoadingOverlayProps) {
  const [progressContainerWidth, setProgressContainerWidth] = React.useState(0);
  const animatedProgressWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (progressContainerWidth <= 0) return;
    const clampedProgress = Math.max(0, Math.min(1, typeof progress === 'number' ? progress : 0));
    const targetWidth = Math.max(
      progressContainerWidth * 0.02,
      Math.min(progressContainerWidth, Math.round(clampedProgress * progressContainerWidth))
    );

    Animated.timing(animatedProgressWidth, {
      toValue: targetWidth,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressContainerWidth, animatedProgressWidth]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className={cn("w-full bg-background-secondary rounded-lg p-8 mx-6 items-center min-w-[280px] max-w-[400px]", className)}>
          <ActivityIndicator 
            size="large" 
            color="#fff" 
            className="mb-4"
          />
          {typeof progress === 'number' && progress >= 0 && progress <= 1 && (
            <View className="w-full mb-4">
              <View
                className="h-2 w-full bg-background rounded-full overflow-hidden"
                onLayout={(e) => setProgressContainerWidth(e.nativeEvent.layout.width)}
              >
                <Animated.View
                  className="h-2 bg-foreground"
                  style={{ width: animatedProgressWidth }}
                />
              </View>
              <Text className="text-text-secondary text-xs mt-2 text-center">
                {Math.max(1, Math.min(100, Math.round(progress * 100)))}%
              </Text>
            </View>
          )}
          {title && (
            <Text variant="h4" className="text-foreground mb-2 text-center">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className="text-text-secondary text-center">
              {subtitle}
            </Text>
          )}
          {!subtitle && message && (
            <Text className="text-text-secondary text-center">
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
