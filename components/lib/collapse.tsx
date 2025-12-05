import { useState, useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { 
	useSharedValue, 
	useAnimatedStyle, 
	withTiming, 
	withSpring,
	Easing 
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronDown } from 'lucide-react-native';
import { Collapsible as CollapsibleRoot, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface CollapseProps {
	children: ReactNode;
	title?: ReactNode;
	className?: string;
	triggerClassName?: string;
	contentClassName?: string;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	right?: ReactNode;
	chevron?: boolean;
	chevronSize?: number;
	textClassName?: string;
	description?: string;
	descriptionClassName?: string;
	comment?: string;
	commentClassName?: string;
}

function Collapse({
	children,
	title,
	className,
	triggerClassName,
	contentClassName,
	open,
	defaultOpen,
	onOpenChange,
	right,
	chevron = true,
	chevronSize = 20,
	textClassName,
	description,
	descriptionClassName,
	comment,
	commentClassName
}: CollapseProps) {
	const isControlled = typeof open === 'boolean';
	const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(!!defaultOpen);
	const isOpen = isControlled ? (open as boolean) : uncontrolledOpen;
	
	// Reanimated shared values for smooth transitions
	const progress = useSharedValue(isOpen ? 1 : 0);
	const opacity = useSharedValue(isOpen ? 1 : 0);
	const translateY = useSharedValue(isOpen ? 0 : -10);

	// Update animations when isOpen changes
	useEffect(() => {
		if (isOpen) {
			// Opening animation - spring for height, timing for opacity
			progress.value = withSpring(1, {
				damping: 20,
				stiffness: 90,
			});
			opacity.value = withTiming(1, {
				duration: 250,
				easing: Easing.out(Easing.ease),
			});
			translateY.value = withTiming(0, {
				duration: 250,
				easing: Easing.out(Easing.ease),
			});
		} else {
			// Closing animation - enhanced with smoother timing and translateY for better visibility
			opacity.value = withTiming(0, {
				duration: 200,
				easing: Easing.in(Easing.ease),
			});
			translateY.value = withTiming(-10, {
				duration: 300,
				easing: Easing.in(Easing.ease),
			});
			progress.value = withTiming(0, {
				duration: 350,
				easing: Easing.inOut(Easing.ease),
			});
		}
	}, [isOpen]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!isControlled) setUncontrolledOpen(nextOpen);
		onOpenChange?.(nextOpen);
	};

	// Animated styles for content
	const contentAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,// Large max height for smooth expansion
			transform: [{ translateY: translateY.value }],
		};
	});

	// Animated style for chevron rotation
	const chevronAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{
				rotate: `${progress.value * 180}deg`,
			}],
		};
	});

	return (
		<CollapsibleRoot
			open={isControlled ? open : undefined}
			defaultOpen={isControlled ? undefined : defaultOpen}
			onOpenChange={handleOpenChange}
		>
			<View className={cn('items-start gap-2', className)}>
				<CollapsibleTrigger>
					<View className={cn('w-full flex-row items-center justify-between', triggerClassName)}>
						{typeof title === 'string' ? <Text className={cn('flex-1', textClassName)}>{title}</Text> : title}
						<Animated.View style={chevronAnimatedStyle}>
							{right ?? (chevron ? <Icon as={ChevronDown} size={chevronSize} /> : null)}
						</Animated.View>
					</View>
					{description && <Text className={cn("text-text-secondary leading-5", descriptionClassName)}>{description}</Text>}
					{comment && <Text className={cn("text-text-secondary leading-5", commentClassName)}>{comment}</Text>}
				</CollapsibleTrigger>
				<CollapsibleContent className={cn('w-full overflow-hidden', contentClassName)}>
					<View>
						{children}
					</View>
				</CollapsibleContent>
			</View>
		</CollapsibleRoot>
	);
}

export { Collapse };

