import { cn } from '@/lib/utils';
import { Platform, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Icon } from './icon';
import { Text } from './text';
import { useState } from 'react';

interface InputProps extends TextInputProps, React.RefAttributes<TextInput> {
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  rightIconLabel?: string;
  error?: boolean;
  helperText?: string;
  errorText?: string;
  leftIconClassName?: string;
  rightIconClassName?: string;
}

function Input({
  className,
  placeholderClassName,
  leftIcon,
  rightIcon,
  onRightIconPress,
  rightIconLabel,
  error = false,
  helperText,
  errorText,
  onFocus,
  onBlur,
  leftIconClassName,
  rightIconClassName,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View className="w-full">
      <View className="relative">
        {leftIcon && (
          <View
            className={cn("absolute left-2 top-1/2 -translate-y-1/2 z-10", leftIconClassName)}
            style={{
              elevation: 10,
            }}>
            <Icon as={leftIcon} size={16} className={cn(
              "text-muted-foreground",
              error && "text-destructive"
            )} />
          </View>
        )}
        <TextInput
          className={cn(
            'border-border-white bg-background text-foreground rounded-sm flex h-10 w-full min-w-0 flex-row items-center border px-3 py-1 text-base leading-5 shadow-sm shadow-black/5 sm:h-9',
            leftIcon && 'pl-6',
            rightIcon && 'pr-6',
            error && 'border-destructive',
            // Native focus border styling
            Platform.OS === 'ios' || Platform.OS === 'android' ? (
              isFocused && !error && 'border-foreground'
            ) : null,
            Platform.OS === 'ios' || Platform.OS === 'android' ? (
              isFocused && error && 'border-destructive'
            ) : null,
            props.editable === false &&
            cn(
              'opacity-50',
              Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
            ),
            Platform.select({
              web: cn(
                'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                error && 'focus-visible:border-destructive focus-visible:ring-destructive/50',
                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
              ),
              native: 'placeholder:text-muted-foreground',
            }),
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{
              elevation: 10,
            }}
            accessibilityLabel={rightIconLabel}
            accessibilityRole="button"
          >
            <Icon as={rightIcon} size={16} className={cn(
              "text-foreground",
              error && "text-destructive"
            )} />
          </TouchableOpacity>
        )}
      </View>
      {(() => {
        const textToShow = error ? errorText : helperText;
        return textToShow && textToShow.trim() ? (
          <Text
            className={cn(
              "mt-1 text-base",
              error ? "text-destructive" : "text-text-secondary"
            )}
          >
            {textToShow}
          </Text>
        ) : null;
      })()}
    </View>
  );
}

export { Input };
