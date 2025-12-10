import React, { useState, useCallback, useMemo } from 'react';
import { Modal, View, Image, Pressable, Dimensions, StyleSheet } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    useDerivedValue,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface PhotoViewerProps {
    visible: boolean;
    images: string[];
    initialIndex?: number;
    onClose: () => void;
    renderWatermark?: (width: number, height: number) => React.ReactNode;
}

export function PhotoViewer({
    visible,
    images,
    initialIndex = 0,
    onClose,
    renderWatermark,
}: PhotoViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

    // Animated values for zoom and pan
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);
    const savedTranslationX = useSharedValue(0);
    const savedTranslationY = useSharedValue(0);

    // Carousel slide position
    const slideX = useSharedValue(0);
    const savedSlideX = useSharedValue(0);

    // Derived value to track if zoomed (for watermark visibility)
    const isZoomed = useDerivedValue(() => {
        return scale.value > 1.1;
    });

    const resetImageTransform = useCallback(() => {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translationX.value = withTiming(0);
        translationY.value = withTiming(0);
        savedTranslationX.value = 0;
        savedTranslationY.value = 0;
        slideX.value = 0;
        savedSlideX.value = 0;
    }, []);

    const loadImageDimensions = useCallback((imageUri: string) => {
        Image.getSize(
            imageUri,
            (width, height) => {
                const aspectRatio = width / height;
                const maxWidth = SCREEN_WIDTH - 40;
                const maxHeight = SCREEN_HEIGHT - 200;

                let optimalWidth = maxWidth;
                let optimalHeight = maxWidth / aspectRatio;

                if (optimalHeight > maxHeight) {
                    optimalHeight = maxHeight;
                    optimalWidth = maxHeight * aspectRatio;
                }

                setImageDimensions({ width: optimalWidth, height: optimalHeight });
            },
            (error) => {
                console.error('Error getting image dimensions:', error);
                setImageDimensions({ width: SCREEN_WIDTH - 40, height: SCREEN_HEIGHT - 200 });
            }
        );
    }, []);

    React.useEffect(() => {
        if (visible && images[currentIndex]) {
            loadImageDimensions(images[currentIndex]);
            resetImageTransform();
        }
    }, [visible, currentIndex, images]);

    React.useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
        }
    }, [visible, initialIndex]);

    const goToNextImage = useCallback(() => {
        if (currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
            resetImageTransform();
        }
    }, [currentIndex, images.length, resetImageTransform]);

    const goToPreviousImage = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            resetImageTransform();
        }
    }, [currentIndex, resetImageTransform]);

    // Pinch gesture for zoom
    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            'worklet';
            scale.value = Math.max(MIN_SCALE, Math.min(savedScale.value * event.scale, MAX_SCALE));
        })
        .onEnd(() => {
            'worklet';
            savedScale.value = scale.value;
            if (scale.value < 1.1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                translationX.value = withSpring(0);
                translationY.value = withSpring(0);
                savedTranslationX.value = 0;
                savedTranslationY.value = 0;
            }
        });

    // Pan gesture for dragging when zoomed OR swiping when not zoomed
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            'worklet';
            if (savedScale.value > 1) {
                // When zoomed, allow panning the image
                translationX.value = savedTranslationX.value + event.translationX;
                translationY.value = savedTranslationY.value + event.translationY;
            } else {
                // When not zoomed, allow horizontal swiping for navigation
                slideX.value = savedSlideX.value + event.translationX;
            }
        })
        .onEnd((event) => {
            'worklet';
            if (savedScale.value > 1) {
                // Save pan position when zoomed
                savedTranslationX.value = translationX.value;
                savedTranslationY.value = translationY.value;
            } else {
                // Handle swipe navigation when not zoomed
                const threshold = SCREEN_WIDTH * 0.25;
                const velocity = event.velocityX;

                if (event.translationX > threshold || velocity > 500) {
                    // Swipe right - go to previous
                    if (currentIndex > 0) {
                        slideX.value = withTiming(SCREEN_WIDTH, { duration: 300 }, () => {
                            'worklet';
                            slideX.value = 0;
                            savedSlideX.value = 0;
                        });
                        // Use a delayed callback to change index
                        setTimeout(() => {
                            goToPreviousImage();
                        }, 50);
                    } else {
                        slideX.value = withSpring(0);
                    }
                } else if (event.translationX < -threshold || velocity < -500) {
                    // Swipe left - go to next
                    if (currentIndex < images.length - 1) {
                        slideX.value = withTiming(-SCREEN_WIDTH, { duration: 300 }, () => {
                            'worklet';
                            slideX.value = 0;
                            savedSlideX.value = 0;
                        });
                        // Use a delayed callback to change index
                        setTimeout(() => {
                            goToNextImage();
                        }, 50);
                    } else {
                        slideX.value = withSpring(0);
                    }
                } else {
                    // Spring back if threshold not met
                    slideX.value = withSpring(0);
                }
                savedSlideX.value = slideX.value;
            }
        });

    // Double tap to zoom
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((event) => {
            'worklet';
            if (scale.value > 1) {
                // Zoom out
                scale.value = withTiming(1);
                savedScale.value = 1;
                translationX.value = withTiming(0);
                translationY.value = withTiming(0);
                savedTranslationX.value = 0;
                savedTranslationY.value = 0;
            } else {
                // Zoom in to 2x at tap position
                const focalX = event.x - SCREEN_WIDTH / 2;
                const focalY = event.y - SCREEN_HEIGHT / 2;

                scale.value = withTiming(2);
                savedScale.value = 2;
                translationX.value = withTiming(-focalX);
                translationY.value = withTiming(-focalY);
                savedTranslationX.value = -focalX;
                savedTranslationY.value = -focalY;
            }
        });

    // Compose gestures
    const composedGesture = Gesture.Race(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture)
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: slideX.value + translationX.value },
            { translateY: translationY.value },
            { scale: scale.value },
        ],
    }));

    // Watermark opacity style - hide when zoomed
    const watermarkAnimatedStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isZoomed.value ? 0 : 1, { duration: 200 }),
    }));

    // Previous/Next image preview opacity
    const prevImageOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            slideX.value,
            [0, SCREEN_WIDTH / 2],
            [0, 0.3],
            Extrapolate.CLAMP
        ),
    }));

    const nextImageOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            slideX.value,
            [-SCREEN_WIDTH / 2, 0],
            [0.3, 0],
            Extrapolate.CLAMP
        ),
    }));

    const handleClose = () => {
        resetImageTransform();
        onClose();
    };

    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < images.length - 1;

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.container}>
                    {/* Header with close button and counter */}
                    <View style={styles.header}>
                        <View style={styles.counterContainer}>
                            <Text className="text-white text-base font-semibold">
                                {currentIndex + 1}
                            </Text>
                            <Text className="text-white/50 text-base"> / </Text>
                            <Text className="text-white/70 text-base">
                                {images.length}
                            </Text>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <View style={styles.closeButtonInner}>
                                <Icon as={X} size={24} className="text-white" strokeWidth={2.5} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Main image viewer with carousel */}
                    <View style={styles.imageContainer}>
                        <GestureDetector gesture={composedGesture}>
                            <Animated.View style={[styles.carouselContainer]}>
                                {/* Previous image preview */}
                                {canGoPrevious && (
                                    <Animated.View style={[styles.previewImageLeft, prevImageOpacity]}>
                                        <Image
                                            source={{ uri: images[currentIndex - 1] }}
                                            style={styles.previewImage}
                                            resizeMode="cover"
                                        />
                                    </Animated.View>
                                )}

                                {/* Current image */}
                                <Animated.View style={[animatedStyle, styles.imageWrapper]}>
                                    {imageDimensions && (
                                        <View style={[styles.imageContent, { width: imageDimensions.width, height: imageDimensions.height }]}>
                                            <Image
                                                source={{ uri: images[currentIndex] }}
                                                style={styles.mainImage}
                                                resizeMode="contain"
                                            />
                                            {renderWatermark && (
                                                <Animated.View style={[styles.watermarkContainer, watermarkAnimatedStyle]}>
                                                    {renderWatermark(imageDimensions.width, imageDimensions.height)}
                                                </Animated.View>
                                            )}
                                        </View>
                                    )}
                                </Animated.View>

                                {/* Next image preview */}
                                {canGoNext && (
                                    <Animated.View style={[styles.previewImageRight, nextImageOpacity]}>
                                        <Image
                                            source={{ uri: images[currentIndex + 1] }}
                                            style={styles.previewImage}
                                            resizeMode="cover"
                                        />
                                    </Animated.View>
                                )}
                            </Animated.View>
                        </GestureDetector>
                    </View>

                    {/* Navigation arrows - only show when not zoomed */}
                    {images.length > 1 && (
                        <View style={styles.navigationContainer}>
                            <Pressable
                                onPress={goToPreviousImage}
                                disabled={!canGoPrevious}
                                style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
                            >
                                <Icon as={ChevronLeft} size={28} className="text-white" strokeWidth={2.5} />
                            </Pressable>
                            <Pressable
                                onPress={goToNextImage}
                                disabled={!canGoNext}
                                style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
                            >
                                <Icon as={ChevronRight} size={28} className="text-white" strokeWidth={2.5} />
                            </Pressable>
                        </View>
                    )}

                    {/* Instruction text */}
                    <View style={styles.instructionContainer}>
                        <Text className="text-white/60 text-xs text-center">
                            {images.length > 1 ? 'Swipe to navigate • ' : ''}Pinch or double tap to zoom
                        </Text>
                    </View>

                    {/* Page indicators */}
                    {images.length > 1 && images.length <= 10 && (
                        <View style={styles.indicatorContainer}>
                            {images.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.indicator,
                                        index === currentIndex && styles.indicatorActive,
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.98)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        zIndex: 10,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeButton: {
        padding: 4,
    },
    closeButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    carouselContainer: {
        width: SCREEN_WIDTH,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContent: {
        position: 'relative',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    previewImageLeft: {
        position: 'absolute',
        left: -SCREEN_WIDTH * 0.8,
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_HEIGHT * 0.4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    previewImageRight: {
        position: 'absolute',
        right: -SCREEN_WIDTH * 0.8,
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_HEIGHT * 0.4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    navigationContainer: {
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        zIndex: 10,
    },
    navButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
    },
    navButtonDisabled: {
        opacity: 0.3,
    },
    instructionContainer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    indicatorContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    indicatorActive: {
        width: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
});
