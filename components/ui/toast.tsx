import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, TouchableOpacity, Image, type ImageStyle } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react-native';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  showCloseButton?: boolean;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
  index?: number;
  showCloseButton?: boolean;
}

const toastVariants = {
  default: {
    image: require('@/assets/images/icons/info_circle.png'),
    bgColor: 'bg-slate-800/95',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-100',
  },
  success: {
    image: require('@/assets/images/icons/check_circle.png'),
    bgColor: 'bg-green-900/95',
    borderColor: 'border-green-500/20',
    textColor: 'text-green-100',
  },
  error: {
    image: require('@/assets/images/icons/x_circle.png'),
    bgColor: 'bg-red-900/95',
    borderColor: 'border-red-500/20',
    textColor: 'text-red-100',
  },
  warning: {
    image: require('@/assets/images/icons/warning_circle.png'),
    bgColor: 'bg-yellow-900/95',
    borderColor: 'border-yellow-500/20',
    textColor: 'text-yellow-100',
  },
  info: {
    image: require('@/assets/images/icons/info_circle.png'),
    bgColor: 'bg-blue-900/95',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-100',
  },
} as const;

const ICON_STYLE: ImageStyle = {
  height: 20,
  width: 20,
};

export function ToastComponent({ toast, onDismiss, index = 0 }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  const variant = toastVariants[toast.variant || 'default'];

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        dismissToast();
      }, toast.duration || 4000);

      return () => clearTimeout(timer);
    }
  }, []);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  // Calculate top position for stacking toasts
  const topPosition = 48 + (index * 80); // 48px from top + 80px spacing per toast

  return (
    <Animated.View
      style={{
        transform: [
          { translateY },
          { scale },
        ],
        opacity,
        position: 'absolute',
        top: topPosition,
        left: 0,
        right: 0,
        zIndex: 1000 + index, // Higher index = higher z-index (newer toasts on top)
        pointerEvents: 'box-none', // Allow touches to pass through to underlying content
      }}
    >
      <View
        className={cn(
          'mx-4 rounded-lg border border-border bg-background-secondary py-2.5 px-4 shadow-lg'
        )}
        style={{ 
          elevation: 1000 + index, // Higher elevation for newer toasts
          pointerEvents: 'auto', // Allow touches on the toast content itself
        }}
      >
        <View className="flex-row items-start gap-1">
          <View className="mt-0.5">
            <Image
              source={variant.image}
              style={ICON_STYLE}
              resizeMode="contain"
            />
          </View>

          <View className="flex-1">
            {toast.title && (
              <Text className={cn('text-sm')}>
                {toast.title}
              </Text>
            )}
            {toast.description && (
              <Text className={cn('mt-1 text-xs text-text-secondary')}>
                {toast.description}
              </Text>
            )}
            {toast.action && (
              <TouchableOpacity
                onPress={toast.action.onPress}
                className="mt-2 self-start"
              >
                <Text className={cn('text-sm font-medium underline', variant.textColor)}>
                  {toast.action.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {toast.showCloseButton && (
            <TouchableOpacity
              onPress={dismissToast}
              className="ml-2 mt-0.5"
            >
              <Icon
                as={X}
                className={cn('size-4 opacity-70', variant.textColor)}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
