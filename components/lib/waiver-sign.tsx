import { View, Modal, Dimensions } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSpring,
    Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";

interface WaiverSignProps {
    visible: boolean;
    onClose: () => void;
    waiverUrl: string; // PDF file URL
    onSign: () => void;
}

const { height: screenHeight } = Dimensions.get('window');
const ANIMATION_DURATION = 100;

export const WaiverSign = ({ visible, onClose, waiverUrl, onSign }: WaiverSignProps) => {
    const [isRendered, setIsRendered] = useState(visible);
    const translateY = useSharedValue(screenHeight);
    const backdropOpacity = useSharedValue(0);
    const { top, bottom } = useSafeAreaInsets();

    const handleClose = () => {
        // Animate backdrop fade out
        backdropOpacity.value = withTiming(0, {
            duration: ANIMATION_DURATION,
            easing: Easing.in(Easing.ease),
        });
        // Animate slide down
        translateY.value = withTiming(screenHeight, {
            duration: ANIMATION_DURATION,
            easing: Easing.in(Easing.ease),
        });
        // Call onClose after animation completes
        setTimeout(() => {
            onClose();
        }, ANIMATION_DURATION);
    };

    useEffect(() => {
        if (visible) {
            setIsRendered(true);
            // Animate backdrop fade in
            backdropOpacity.value = withTiming(1, {
                duration: ANIMATION_DURATION,
                easing: Easing.out(Easing.ease),
            });
            // Animate slide up with spring for smooth bounce
            translateY.value = withSpring(0, {
                damping: 20,
                stiffness: 100,
                mass: 0.8,
            });
        } else {
            // If visible becomes false externally, animate out
            backdropOpacity.value = withTiming(0, {
                duration: ANIMATION_DURATION,
                easing: Easing.in(Easing.ease),
            });
            translateY.value = withTiming(screenHeight, {
                duration: ANIMATION_DURATION,
                easing: Easing.in(Easing.ease),
            });
            // Unmount after animation completes
            setTimeout(() => {
                setIsRendered(false);
            }, ANIMATION_DURATION);
        }
    }, [visible]);

    const modalStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    if (!isRendered) return null;

    return (
        <Modal visible={visible} onRequestClose={handleClose} transparent animationType="none">
            <View className="flex-1 justify-end items-center">
                <Animated.View
                    style={[
                        {
                            height: screenHeight,
                            width: '100%',
                            paddingTop: top,
                            paddingBottom: bottom,
                        },
                        modalStyle
                    ]}
                    className="bg-background"
                >
                    <View className="flex-1">
                        {/* Header */}
                        <View className="flex-row items-center justify-between p-4 border-b border-border">
                            <Text variant="h6" className="leading-tight">Sign Waiver Agreement</Text>
                            <Button variant="ghost" size="icon" onPress={handleClose}>
                                <Icon as={X} size={24} />
                            </Button>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
