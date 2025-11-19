import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
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
}: CollapseProps) {
	const isControlled = typeof open === 'boolean';
	const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(!!defaultOpen);
	const isOpen = isControlled ? (open as boolean) : uncontrolledOpen;

	const handleOpenChange = (nextOpen: boolean) => {
		if (!isControlled) setUncontrolledOpen(nextOpen);
		onOpenChange?.(nextOpen);
	};

	return (
		<CollapsibleRoot
			open={isControlled ? open : undefined}
			defaultOpen={isControlled ? undefined : defaultOpen}
			onOpenChange={handleOpenChange}
		>
			<View className={cn('items-start gap-2', className)}>
				<CollapsibleTrigger>
					<View className={cn('w-full flex-row items-start justify-between', triggerClassName)}>
						{typeof title === 'string' ? <Text className={cn('flex-1', textClassName)}>{title}</Text> : title}
						{right ?? (chevron ? <Icon as={isOpen ? ChevronUp : ChevronDown} size={chevronSize} /> : null)}
					</View>
					{description && <Text className="text-text-secondary leading-5">{description}</Text>}
				</CollapsibleTrigger>
				<CollapsibleContent className={cn('w-full', contentClassName)}>
					{children}
				</CollapsibleContent>
			</View>
		</CollapsibleRoot>
	);
}

export { Collapse };

