import { cn } from '@/lib/utils';
import { Pressable, Platform } from 'react-native';
import { THEME } from '@/lib/theme';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SwitchSize = 'sm' | 'md' | 'lg';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: SwitchSize;
  disabled?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'h-4 w-7',
    thumb: 'h-3 w-3',
    translateX: { checked: 12, unchecked: 2 },
  },
  md: {
    container: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translateX: { checked: 21, unchecked: 2 },
  },
  lg: {
    container: 'h-8 w-14',
    thumb: 'h-7 w-7',
    translateX: { checked: 27, unchecked: 2 },
  },
};

function Switch({
  checked = false,
  onCheckedChange,
  size = 'md',
  disabled = false,
  className,
}: SwitchProps) {
  const config = sizeConfig[size];
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, {
      duration: 200,
    });
  }, [checked, progress]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [THEME.dark.buttonLabelSecondary, THEME.dark.success]
    );

    return {
      backgroundColor,
    };
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [config.translateX.unchecked, config.translateX.checked]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const handlePress = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      className={cn(
        'flex shrink-0 flex-row items-center rounded-full border border-transparent shadow-sm shadow-black/5',
        config.container,
        Platform.select({
          web: 'focus-visible:border-ring focus-visible:ring-ring/50 peer inline-flex outline-none transition-all focus-visible:ring-[3px]',
        }),
        disabled && 'opacity-50',
        className
      )}
      style={containerAnimatedStyle}
    >
      <Animated.View
        className={cn(
          'bg-foreground rounded-full',
          config.thumb
        )}
        style={thumbAnimatedStyle}
      />
    </AnimatedPressable>
  );
}

export { Switch };
