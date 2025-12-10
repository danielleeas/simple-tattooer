import React, { useState, useCallback } from 'react';
import { Modal, View, Image, Pressable, Dimensions, StyleSheet } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY_THRESHOLD = 400;

interface PhotoViewerProps {
    visible: boolean;
    images: string[];
    initialIndex?: number;
    onClose: () => void;
    renderWatermark?: (width: number, height: number) => React.ReactNode;
}

// Fixed image container dimensions
const IMAGE_CONTAINER_WIDTH = SCREEN_WIDTH - 24;
const IMAGE_CONTAINER_HEIGHT = SCREEN_HEIGHT - 200;

export function PhotoViewer({
    visible,
    images,
    initialIndex = 0,
    onClose,
    renderWatermark,
}: PhotoViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

    // Animated values for zoom and pan (current image only)
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);
    const savedTranslationX = useSharedValue(0);
    const savedTranslationY = useSharedValue(0);

    // Carousel offset - moves all images together
    const carouselOffset = useSharedValue(0);

    const resetZoom = useCallback(() => {
        scale.value = 1;
        savedScale.value = 1;
        translationX.value = 0;
        translationY.value = 0;
        savedTranslationX.value = 0;
        savedTranslationY.value = 0;
    }, []);

    // Calculate actual displayed image size based on aspect ratio
    const loadImageDimensions = useCallback((imageUri: string) => {
        Image.getSize(
            imageUri,
            (width, height) => {
                const imageAspectRatio = width / height;
                const containerAspectRatio = IMAGE_CONTAINER_WIDTH / IMAGE_CONTAINER_HEIGHT;

                let displayWidth: number;
                let displayHeight: number;

                if (imageAspectRatio > containerAspectRatio) {
                    // Image is wider - fit to width
                    displayWidth = IMAGE_CONTAINER_WIDTH;
                    displayHeight = IMAGE_CONTAINER_WIDTH / imageAspectRatio;
                } else {
                    // Image is taller - fit to height
                    displayHeight = IMAGE_CONTAINER_HEIGHT;
                    displayWidth = IMAGE_CONTAINER_HEIGHT * imageAspectRatio;
                }

                setImageDimensions({ width: displayWidth, height: displayHeight });
            },
            () => {
                // Fallback to container size
                setImageDimensions({ width: IMAGE_CONTAINER_WIDTH, height: IMAGE_CONTAINER_HEIGHT });
            }
        );
    }, []);

    React.useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
            carouselOffset.value = 0;
            resetZoom();
        }
    }, [visible, initialIndex]);

    // Load dimensions when current image changes
    React.useEffect(() => {
        if (visible && images[currentIndex]) {
            loadImageDimensions(images[currentIndex]);
        }
    }, [visible, currentIndex, images, loadImageDimensions]);

    // Track if animation is in progress
    const isAnimating = React.useRef(false);
    // Track pending index change to sync with offset reset
    const pendingIndexChange = React.useRef<number | null>(null);

    // Reset offset when index changes - this happens during render, before paint
    React.useLayoutEffect(() => {
        if (pendingIndexChange.current !== null) {
            carouselOffset.value = 0;
            pendingIndexChange.current = null;
            isAnimating.current = false;
        }
    }, [currentIndex]);

    const goToNext = useCallback(() => {
        if (currentIndex < images.length - 1 && !isAnimating.current) {
            isAnimating.current = true;
            carouselOffset.value = withTiming(-SCREEN_WIDTH, { duration: 220, easing: Easing.out(Easing.cubic) });
            setTimeout(() => {
                pendingIndexChange.current = currentIndex + 1;
                setCurrentIndex(prev => prev + 1);
                resetZoom();
            }, 230);
        }
    }, [currentIndex, images.length, resetZoom]);

    const goToPrevious = useCallback(() => {
        if (currentIndex > 0 && !isAnimating.current) {
            isAnimating.current = true;
            carouselOffset.value = withTiming(SCREEN_WIDTH, { duration: 220, easing: Easing.out(Easing.cubic) });
            setTimeout(() => {
                pendingIndexChange.current = currentIndex - 1;
                setCurrentIndex(prev => prev - 1);
                resetZoom();
            }, 230);
        }
    }, [currentIndex, resetZoom]);

    // Handle swipe end on JS thread
    const handleSwipeComplete = useCallback((direction: 'next' | 'prev' | 'none') => {
        if (isAnimating.current) return;

        if (direction === 'next' && currentIndex < images.length - 1) {
            isAnimating.current = true;
            const currentOffset = carouselOffset.value;
            const remainingDistance = Math.abs(-SCREEN_WIDTH - currentOffset);
            const duration = Math.max(80, Math.min(180, remainingDistance * 0.25));

            carouselOffset.value = withTiming(-SCREEN_WIDTH, {
                duration,
                easing: Easing.out(Easing.cubic)
            });

            setTimeout(() => {
                pendingIndexChange.current = currentIndex + 1;
                setCurrentIndex(prev => prev + 1);
                resetZoom();
            }, duration + 10);

        } else if (direction === 'prev' && currentIndex > 0) {
            isAnimating.current = true;
            const currentOffset = carouselOffset.value;
            const remainingDistance = Math.abs(SCREEN_WIDTH - currentOffset);
            const duration = Math.max(80, Math.min(180, remainingDistance * 0.25));

            carouselOffset.value = withTiming(SCREEN_WIDTH, {
                duration,
                easing: Easing.out(Easing.cubic)
            });

            setTimeout(() => {
                pendingIndexChange.current = currentIndex - 1;
                setCurrentIndex(prev => prev - 1);
                resetZoom();
            }, duration + 10);

        } else {
            // Snap back
            carouselOffset.value = withSpring(0, { damping: 20, stiffness: 400 });
        }
    }, [currentIndex, images.length, resetZoom]);

    // Pinch gesture for zoom
    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            'worklet';
            scale.value = Math.max(MIN_SCALE, Math.min(savedScale.value * e.scale, MAX_SCALE));
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

    // Pan gesture - handles both zoom panning and carousel swiping
    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            'worklet';
            if (savedScale.value > 1) {
                // Zoomed: pan the image
                translationX.value = savedTranslationX.value + e.translationX;
                translationY.value = savedTranslationY.value + e.translationY;
            } else {
                // Not zoomed: swipe carousel
                carouselOffset.value = e.translationX;
            }
        })
        .onEnd((e) => {
            'worklet';
            if (savedScale.value > 1) {
                savedTranslationX.value = translationX.value;
                savedTranslationY.value = translationY.value;
            } else {
                // Determine swipe direction
                const swipedLeft = e.translationX < -SWIPE_THRESHOLD || e.velocityX < -SWIPE_VELOCITY_THRESHOLD;
                const swipedRight = e.translationX > SWIPE_THRESHOLD || e.velocityX > SWIPE_VELOCITY_THRESHOLD;

                if (swipedLeft) {
                    runOnJS(handleSwipeComplete)('next');
                } else if (swipedRight) {
                    runOnJS(handleSwipeComplete)('prev');
                } else {
                    runOnJS(handleSwipeComplete)('none');
                }
            }
        });

    // Double tap to zoom
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((e) => {
            'worklet';
            if (scale.value > 1) {
                scale.value = withTiming(1);
                savedScale.value = 1;
                translationX.value = withTiming(0);
                translationY.value = withTiming(0);
                savedTranslationX.value = 0;
                savedTranslationY.value = 0;
            } else {
                const focalX = e.x - SCREEN_WIDTH / 2;
                const focalY = e.y - SCREEN_HEIGHT / 2;
                scale.value = withTiming(2.5);
                savedScale.value = 2.5;
                translationX.value = withTiming(-focalX * 1.5);
                translationY.value = withTiming(-focalY * 1.5);
                savedTranslationX.value = -focalX * 1.5;
                savedTranslationY.value = -focalY * 1.5;
            }
        });

    // Combine gestures
    const composedGesture = Gesture.Race(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture)
    );

    // Animated styles for current image (zoom + pan + carousel offset)
    const currentImageStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: carouselOffset.value + translationX.value },
            { translateY: translationY.value },
            { scale: scale.value },
        ],
    }));

    // Animated style for previous image (left side)
    const prevImageStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: carouselOffset.value - SCREEN_WIDTH },
        ],
        opacity: 1,
    }));

    // Animated style for next image (right side)
    const nextImageStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: carouselOffset.value + SCREEN_WIDTH },
        ],
        opacity: 1,
    }));


    const handleClose = useCallback(() => {
        resetZoom();
        carouselOffset.value = 0;
        onClose();
    }, [onClose, resetZoom]);

    const canGoPrev = currentIndex > 0;
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
            <GestureHandlerRootView style={styles.root}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.counter}>
                            <Text className="text-white text-base font-bold">
                                {currentIndex + 1}
                            </Text>
                            <Text className="text-white/40 text-base mx-1">/</Text>
                            <Text className="text-white/60 text-base">
                                {images.length}
                            </Text>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeBtn}>
                            <View style={styles.closeBtnInner}>
                                <Icon as={X} size={22} className="text-white" strokeWidth={2.5} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Carousel */}
                    <View style={styles.carouselWrapper}>
                        <GestureDetector gesture={composedGesture}>
                            <Animated.View style={styles.carousel}>
                                {/* Previous Image */}
                                {canGoPrev && (
                                    <Animated.View style={[styles.slideContainer, prevImageStyle]}>
                                        <View style={styles.slideImageWrapper}>
                                            <Image
                                                source={{ uri: images[currentIndex - 1] }}
                                                style={styles.slideImage}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    </Animated.View>
                                )}

                                {/* Current Image */}
                                <Animated.View style={[styles.slideContainer, styles.currentSlide, currentImageStyle]}>
                                    <View style={[
                                        styles.imageFrame,
                                        imageDimensions && { width: imageDimensions.width, height: imageDimensions.height }
                                    ]}>
                                        <Image
                                            source={{ uri: images[currentIndex] }}
                                            style={styles.mainImage}
                                            resizeMode="contain"
                                        />
                                        {renderWatermark && imageDimensions && (
                                            <View style={styles.watermark}>
                                                {renderWatermark(imageDimensions.width, imageDimensions.height)}
                                            </View>
                                        )}
                                    </View>
                                </Animated.View>

                                {/* Next Image */}
                                {canGoNext && (
                                    <Animated.View style={[styles.slideContainer, nextImageStyle]}>
                                        <View style={styles.slideImageWrapper}>
                                            <Image
                                                source={{ uri: images[currentIndex + 1] }}
                                                style={styles.slideImage}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    </Animated.View>
                                )}
                            </Animated.View>
                        </GestureDetector>
                    </View>

                    {/* Navigation Buttons */}
                    {images.length > 1 && (
                        <View style={styles.navRow}>
                            <Pressable
                                onPress={goToPrevious}
                                disabled={!canGoPrev}
                                style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
                            >
                                <Icon as={ChevronLeft} size={26} className="text-white" strokeWidth={2.5} />
                            </Pressable>
                            <Pressable
                                onPress={goToNext}
                                disabled={!canGoNext}
                                style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
                            >
                                <Icon as={ChevronRight} size={26} className="text-white" strokeWidth={2.5} />
                            </Pressable>
                        </View>
                    )}

                    {/* Page Dots */}
                    {images.length > 1 && images.length <= 12 && (
                        <View style={styles.dots}>
                            {images.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        i === currentIndex && styles.dotActive,
                                    ]}
                                />
                            ))}
                        </View>
                    )}

                    {/* Hint */}
                    <View style={styles.hint}>
                        <Text className="text-white/50 text-xs">
                            {images.length > 1 ? 'Swipe to browse • ' : ''}Double tap or pinch to zoom
                        </Text>
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 16,
        zIndex: 20,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeBtn: {
        padding: 4,
    },
    closeBtnInner: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    carouselWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
    carousel: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slideContainer: {
        position: 'absolute',
        width: SCREEN_WIDTH,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentSlide: {
        zIndex: 10,
    },
    slideImageWrapper: {
        width: IMAGE_CONTAINER_WIDTH,
        height: IMAGE_CONTAINER_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slideImage: {
        width: '100%',
        height: '100%',
    },
    imageFrame: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    watermark: {
        ...StyleSheet.absoluteFillObject,
    },
    navRow: {
        position: 'absolute',
        bottom: 110,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 20,
    },
    navBtn: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navBtnDisabled: {
        opacity: 0.25,
    },
    dots: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        zIndex: 20,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dotActive: {
        width: 20,
        borderRadius: 3,
        backgroundColor: '#fff',
    },
    hint: {
        position: 'absolute',
        bottom: 36,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
    },
});
