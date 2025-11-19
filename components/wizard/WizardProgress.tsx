import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { THEME } from '@/lib/theme';
import { Text } from '@/components/ui/text';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {

  const slideAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimations = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (currentStep > 0) {
      // Slide down animation
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Hide animation
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentStep, slideAnimation]);

  // Animate progress bar segments
  useEffect(() => {
    const animations = progressAnimations.map((animation, index) => {
      const targetValue = index < currentStep ? 1 : 0;
      return Animated.timing(animation, {
        toValue: targetValue,
        duration: 300,
        useNativeDriver: true, // Transform animations can use native driver
      });
    });

    Animated.parallel(animations).start();
  }, [currentStep, progressAnimations]);

  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0], // Start from -100 (hidden above) to 0 (visible)
  });

  const opacity = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View 
      className="bg-background" 
      style={{ 
        transform: [{ translateY }],
        opacity,
      }}
    >
      {/* Progress Bar */}
      <View className="px-6 py-4">
        <View className="flex-row gap-2 items-center">
          {Array.from({ length: totalSteps }, (_, index) => {
            const animation = progressAnimations[index];
            
            const scaleX = animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            });

            return (
              <View
                key={index}
                className="h-1 flex-1 rounded-full overflow-hidden"
                style={{ backgroundColor: THEME.dark.backgroundTertiary }}
              >
                <Animated.View
                  className="h-full rounded-full"
                  style={{
                    flex: 1,
                    backgroundColor: THEME.dark.textSecondary,
                    transform: [{ scaleX }],
                    transformOrigin: 'left',
                  }}
                />
              </View>
            );
          })}
          <View className="items-center w-[25px]">
            <Text className="text-sm text-text-secondary">
              {currentStep}/{totalSteps}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
