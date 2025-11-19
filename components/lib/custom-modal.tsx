import React, { useEffect, useState } from 'react';
import { Pressable, View, StyleSheet, Dimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import { cn } from '@/lib/utils';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export type ModalVariant = 'bottom-sheet' | 'center' | 'fullscreen';

export interface CustomModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    variant?: ModalVariant;
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
    animationDuration?: number;
    backdropOpacity?: number;
    borderRadius?: number;
    className?: string;
}

export default function CustomModal({
    visible,
    onClose,
    children,
    variant = 'bottom-sheet',
    showCloseButton = true,
    closeOnBackdrop = true,
    animationDuration = 300,
    backdropOpacity = 0.5,
    borderRadius = 20,
    className
}: CustomModalProps) {
    const [isRendered, setIsRendered] = useState(visible);
    const backdropOpacityValue = useSharedValue(0);
    const modalTranslateY = useSharedValue(SCREEN_HEIGHT);
    const modalScale = useSharedValue(0);
    const modalOpacity = useSharedValue(0);

    const backdropStyle = useAnimatedStyle(() => {
        return {
            opacity: backdropOpacityValue.value,
        };
    });

    const bottomSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: modalTranslateY.value }],
            opacity: modalOpacity.value,
        };
    });

    const centerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: modalScale.value }],
            opacity: modalOpacity.value,
        };
    });

    const fullscreenStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: modalTranslateY.value }],
            opacity: modalOpacity.value,
        };
    });

    const getModalAnimatedStyle = () => {
        switch (variant) {
            case 'bottom-sheet':
                return bottomSheetStyle;
            case 'center':
                return centerStyle;
            case 'fullscreen':
                return fullscreenStyle;
            default:
                return bottomSheetStyle;
        }
    };

    const modalStyle = getModalAnimatedStyle();

    const showModal = () => {
        backdropOpacityValue.value = withTiming(backdropOpacity, {
            duration: animationDuration,
        });

        switch (variant) {
            case 'bottom-sheet':
                modalTranslateY.value = withTiming(0, {
                    duration: animationDuration,
                });
                modalOpacity.value = withTiming(1, {
                    duration: animationDuration,
                });
                break;
            case 'center':
                modalScale.value = withTiming(1, {
                    duration: animationDuration,
                });
                modalOpacity.value = withTiming(1, {
                    duration: animationDuration,
                });
                break;
            case 'fullscreen':
                modalTranslateY.value = withTiming(0, {
                    duration: animationDuration,
                });
                modalOpacity.value = withTiming(1, {
                    duration: animationDuration,
                });
                break;
        }
    };

    const hideModal = () => {
        backdropOpacityValue.value = withTiming(0, {
            duration: animationDuration,
        });

        switch (variant) {
            case 'bottom-sheet':
                modalTranslateY.value = withTiming(SCREEN_HEIGHT, {
                    duration: animationDuration,
                });
                modalOpacity.value = withTiming(0, {
                    duration: animationDuration,
                });
                break;
            case 'center':
                modalScale.value = withTiming(0, {
                    duration: animationDuration,
                });
                modalOpacity.value = withTiming(0, {
                    duration: animationDuration,
                });
                break;
            case 'fullscreen':
                modalTranslateY.value = withTiming(SCREEN_HEIGHT, {
                    duration: animationDuration,
                });
                modalOpacity.value = withTiming(0, {
                    duration: animationDuration,
                });
                break;
        }

        // Call onClose after animation completes
        setTimeout(() => {
            onClose();
            setIsRendered(false);
        }, animationDuration);
    };

    const handleBackdropPress = () => {
        if (closeOnBackdrop) {
            hideModal();
        }
    };

    const handleCloseButton = () => {
        hideModal();
    };

    useEffect(() => {
        if (visible) {
            setIsRendered(true);
            showModal();
        } else {
            // keep rendered to allow exit animation, unmount in hideModal timeout
            hideModal();
        }
    }, [visible]);

    if (!isRendered) return null;

    const getModalContainerStyle = (): any => {
        switch (variant) {
            case 'bottom-sheet':
                return {
                    ...styles.modalContainer,
                    justifyContent: 'flex-end' as const,
                    backgroundColor: 'transparent',
                };
            case 'center':
                return {
                    ...styles.modalContainer,
                    justifyContent: 'center' as const,
                    alignItems: 'center' as const,
                    backgroundColor: 'transparent',
                };
            case 'fullscreen':
                return {
                    ...styles.modalContainer,
                    backgroundColor: 'transparent',
                };
            default:
                return {
                    ...styles.modalContainer,
                    justifyContent: 'flex-end' as const,
                    backgroundColor: 'transparent',
                };
        }
    };

    const getModalContentStyle = (): any => {
        switch (variant) {
            case 'bottom-sheet':
                return {
                    ...styles.modalContent,
                    borderTopLeftRadius: borderRadius,
                    borderTopRightRadius: borderRadius,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    maxHeight: SCREEN_HEIGHT - 40,
                    paddingBottom: 0,
                    paddingTop: 40
                };
            case 'center':
                return {
                    ...styles.modalContent,
                    borderRadius,
                    maxWidth: SCREEN_WIDTH -32,
                    maxHeight: SCREEN_HEIGHT - 40,
                    flexGrow: 1,
                    justifyContent: 'center',
                };
            case 'fullscreen':
                return {
                    ...styles.modalContent,
                    borderRadius: 0,
                    height: SCREEN_HEIGHT,
                    width: SCREEN_WIDTH,
                    paddingTop: 40,
                };
            default:
                return {
                    ...styles.modalContent,
                    borderTopLeftRadius: borderRadius,
                    borderTopRightRadius: borderRadius,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    maxHeight: SCREEN_HEIGHT * 0.9,
                };
        }
    };

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable
                    style={styles.backdropPressable}
                    onPress={handleBackdropPress}
                />
            </Animated.View>

            <View style={getModalContainerStyle()}>
                <Animated.View style={[getModalContentStyle(), modalStyle]} className={cn(className, 'w-full')}>
                    {showCloseButton && (
                        <Pressable
                            style={styles.closeButton}
                            onPress={handleCloseButton}
                        >
                            <Icon as={X} size={24} />
                        </Pressable>
                    )}
                    <KeyboardAwareScrollView
                        keyboardShouldPersistTaps="handled"
                        bottomOffset={0}
                        disableScrollOnKeyboardHide={true}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={variant === 'center' && {
                            flexGrow: 1,
                            justifyContent: 'center',
                        }}
                    >
                        {children}
                    </KeyboardAwareScrollView>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdropPressable: {
        flex: 1,
    },
    modalContainer: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 15,
        zIndex: 1,
        padding: 5,
    },
});
