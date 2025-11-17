import React, { memo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface StableGestureWrapperProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  threshold?: number;
  enabled?: boolean;
}

// Memoized gesture wrapper that won't re-render unnecessarily
export const StableGestureWrapper = memo(({ 
  children, 
  onSwipeRight, 
  onSwipeLeft, 
  threshold = 100, 
  enabled = true 
}: StableGestureWrapperProps) => {
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    // Restrict to horizontal swipes so vertical scroll views still work
    .activeOffsetX([-20, 20])
    .failOffsetY([-12, 12])
    .onEnd((event) => {
      // Check if swipe threshold is met
      if (Math.abs(event.translationX) > threshold) {
        if (event.translationX > 0 && onSwipeRight) {
          // Swipe right detected
          runOnJS(onSwipeRight)();
        } else if (event.translationX < 0 && onSwipeLeft) {
          // Swipe left detected
          runOnJS(onSwipeLeft)();
        }
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </GestureDetector>
  );
});
