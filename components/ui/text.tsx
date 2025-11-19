import { cn } from '@/lib/utils';
import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';
import { getFontFamilyWithWeight } from '@/lib/fonts';

const textVariants = cva(
  cn(
    'text-base text-foreground font-arial',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        h1: cn(
          'text-center text-5xl leading-[1.25] font-arial',
          Platform.select({ 
            web: 'scroll-m-20 text-balance font-medium',
            default: 'font-normal' // Use normal weight on native platforms
          })
        ),
        h2: cn(
          'text-4xl',
          Platform.select({ web: 'scroll-m-20 first:mt-0' })
        ),
        h3: cn('text-3xl', Platform.select({ web: 'scroll-m-20' })),
        h4: cn('text-2xl', Platform.select({ web: 'scroll-m-20' })),
        h5: cn('text-xl', Platform.select({ web: 'scroll-m-20' })),
        h6: cn('text-lg', Platform.select({ web: 'scroll-m-20' })),
        p: 'leading-5',
        blockquote: 'mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6',
        code: cn(
          'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm'
        ),
        lead: 'text-xl text-muted-foreground',
        large: 'text-lg',
        small: cn(
          'text-sm leading-none',
          Platform.select({
            web: 'font-medium',
            default: 'font-normal'
          })
        ),
        muted: 'text-sm text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
  h5: '5',
  h6: '6',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  style,
  ...props
}: React.ComponentProps<typeof RNText> &
  TextVariantProps &
  React.RefAttributes<RNText> & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  
  // Handle font weight for Android
  const androidStyle = React.useMemo(() => {
    if (Platform.OS === 'android') {
      const baseStyle = (style as any) || {};
      
      // Apply font family with weight for specific variants
      if (variant === 'h1') {
        return {
          ...baseStyle,
          fontFamily: getFontFamilyWithWeight('arial', 'normal'),
        };
      }
      if (variant === 'small') {
        return {
          ...baseStyle,
          fontFamily: getFontFamilyWithWeight('arial', 'normal'),
        };
      }
      
      return baseStyle;
    }
    return style;
  }, [variant, style]);

  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      style={androidStyle}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };
