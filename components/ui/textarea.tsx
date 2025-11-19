import { cn } from '@/lib/utils';
import { Platform, TextInput, type TextInputProps } from 'react-native';
import { useState } from 'react';

interface TextareaProps extends TextInputProps, React.RefAttributes<TextInput> {
  error?: boolean;
  placeholderClassName?: string;
}

function Textarea({
  className,
  multiline = true,
  numberOfLines = Platform.select({ web: 2, native: 8 }), // On web, numberOfLines also determines initial height. On native, it determines the maximum height.
  placeholderClassName,
  error = false,
  onFocus,
  onBlur,
  ...props
}: TextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <TextInput
      className={cn(
        'text-foreground border-border-white dark:bg-input/30 rounded-sm flex w/full flex-row border bg-transparent px-3 py-2 text-base shadow-sm shadow-black/5 md:text-sm',
        error && 'border-destructive',
        // Native focus border styling to mirror Input component
        Platform.OS === 'ios' || Platform.OS === 'android' ? (
          isFocused && !error && 'border-foreground'
        ) : null,
        Platform.OS === 'ios' || Platform.OS === 'android' ? (
          isFocused && error && 'border-destructive'
        ) : null,
        Platform.select({
          web: 'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive field-sizing-content resize-y outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed',
          native: 'placeholder:text-muted-foreground', // Keep min height on native
        }),
        props.editable === false && 'opacity-50',
        className
      )}
      placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical="top"
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
  );
}

export { Textarea };
