import React, { useState, useCallback, useEffect } from 'react';
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
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_VELOCITY_THRESHOLD = 400;

interface PhotoViewerProps {
    visible: boolean;
    images: string[];
    initialIndex?: number;
    onClose: () => void;
    renderWatermark?: (width: number, height: number) => React.ReactNode;
}

// Fixed container dimensions
const CONTAINER_WIDTH = SCREEN_WIDTH;
const CONTAINER_HEIGHT = SCREEN_HEIGHT - 200;

export function PhotoViewer({
    visible,
    images,
    initialIndex = 0,
    onClose,
    renderWatermark,
}: PhotoViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [imageSizes, setImageSizes] = useState<Map<number, { width: number; height: number }>>(new Map());

    // Carousel position - represents which image is centered
    const translateX = useSharedValue(0);

    // Shared value for current index (needed for worklet access)
    const currentIndexShared = useSharedValue(initialIndex);

    // Zoom and pan for current image
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const panX = useSharedValue(0);
    const panY = useSharedValue(0);
    const savedPanX = useSharedValue(0);
    const savedPanY = useSharedValue(0);

    const resetZoom = useCallback(() => {
        scale.value = 1;
        savedScale.value = 1;
        panX.value = 0;
        panY.value = 0;
        savedPanX.value = 0;
        savedPanY.value = 0;
    }, []);

    // Load image dimensions for watermark sizing
    const loadImageSize = useCallback((index: number, uri: string) => {
        Image.getSize(
            uri,
            (width, height) => {
                const imageAspectRatio = width / height;
                const containerAspectRatio = (CONTAINER_WIDTH - 24) / CONTAINER_HEIGHT;

                let displayWidth: number;
                let displayHeight: number;

                if (imageAspectRatio > containerAspectRatio) {
                    displayWidth = CONTAINER_WIDTH - 24;
                    displayHeight = (CONTAINER_WIDTH - 24) / imageAspectRatio;
                } else {
                    displayHeight = CONTAINER_HEIGHT;
                    displayWidth = CONTAINER_HEIGHT * imageAspectRatio;
                }

                setImageSizes(prev => new Map(prev).set(index, { width: displayWidth, height: displayHeight }));
            },
            () => {
                setImageSizes(prev => new Map(prev).set(index, { width: CONTAINER_WIDTH - 24, height: CONTAINER_HEIGHT }));
            }
        );
    }, []);

    // Initialize when opened
    useEffect(() => {
        if (visible) {
            currentIndexShared.value = initialIndex;
            setCurrentIndex(initialIndex);
            translateX.value = -initialIndex * SCREEN_WIDTH;
            resetZoom();

            // Load all image sizes
            images.forEach((uri, index) => {
                loadImageSize(index, uri);
            });
        }
    }, [visible, initialIndex, images]);

    // Animate to specific index
    const animateToIndex = useCallback((index: number, duration: number = 250) => {
        translateX.value = withTiming(-index * SCREEN_WIDTH, {
            duration,
            easing: Easing.out(Easing.cubic),
        });
        currentIndexShared.value = index;
        setCurrentIndex(index);
        resetZoom();
    }, [resetZoom]);

    const goToNext = useCallback(() => {
        if (currentIndex < images.length - 1) {
            animateToIndex(currentIndex + 1);
        }
    }, [currentIndex, images.length, animateToIndex]);

    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            animateToIndex(currentIndex - 1);
        }
    }, [currentIndex, animateToIndex]);

    // Handle swipe completion
    const handleSwipeEnd = useCallback((velocityX: number, translationAmount: number) => {
        const currentOffset = translateX.value;
        const currentPosition = -currentOffset / SCREEN_WIDTH;

        let targetIndex: number;

        if (velocityX < -SWIPE_VELOCITY_THRESHOLD || translationAmount < -SWIPE_THRESHOLD) {
            // Swipe left - go to next
            targetIndex = Math.min(images.length - 1, Math.ceil(currentPosition));
        } else if (velocityX > SWIPE_VELOCITY_THRESHOLD || translationAmount > SWIPE_THRESHOLD) {
            // Swipe right - go to previous
            targetIndex = Math.max(0, Math.floor(currentPosition));
        } else {
            // Snap to nearest
            targetIndex = Math.round(currentPosition);
        }

        targetIndex = Math.max(0, Math.min(images.length - 1, targetIndex));
        animateToIndex(targetIndex, 200);
    }, [images.length, animateToIndex]);

    // Pinch gesture
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
                panX.value = withSpring(0);
                panY.value = withSpring(0);
                savedPanX.value = 0;
                savedPanY.value = 0;
            }
        });

    // Pan gesture - handles zoom panning and carousel swiping
    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            'worklet';
            if (savedScale.value > 1) {
                // Zoomed: pan the image
                panX.value = savedPanX.value + e.translationX;
                panY.value = savedPanY.value + e.translationY;
            } else {
                // Not zoomed: move carousel
                translateX.value = -currentIndexShared.value * SCREEN_WIDTH + e.translationX;
            }
        })
        .onEnd((e) => {
            'worklet';
            if (savedScale.value > 1) {
                savedPanX.value = panX.value;
                savedPanY.value = panY.value;
            } else {
                runOnJS(handleSwipeEnd)(e.velocityX, e.translationX);
            }
        });

    // Double tap to zoom
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            'worklet';
            if (scale.value > 1) {
                // Zoom out
                scale.value = withTiming(1, { duration: 250 });
                savedScale.value = 1;
                panX.value = withTiming(0, { duration: 250 });
                panY.value = withTiming(0, { duration: 250 });
                savedPanX.value = 0;
                savedPanY.value = 0;
            } else {
                // Zoom in to 2.5x - center of the image
                scale.value = withTiming(2.5, { duration: 250 });
                savedScale.value = 2.5;
                // Keep centered (no pan offset on double tap)
                panX.value = 0;
                panY.value = 0;
                savedPanX.value = 0;
                savedPanY.value = 0;
            }
        });

    const composedGesture = Gesture.Race(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture)
    );

    // Carousel container style
    const carouselStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    // Current image transform (zoom + pan)
    const currentImageTransform = useAnimatedStyle(() => ({
        transform: [
            { translateX: panX.value },
            { translateY: panY.value },
            { scale: scale.value },
        ],
    }));

    const handleClose = useCallback(() => {
        resetZoom();
        onClose();
    }, [onClose, resetZoom]);

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

                    {/* Carousel - All images rendered */}
                    <GestureDetector gesture={composedGesture}>
                        <Animated.View style={styles.carouselWrapper}>
                            <Animated.View style={[styles.carousel, carouselStyle]}>
                                {images.map((uri, index) => {
                                    const isCurrentImage = index === currentIndex;
                                    const imageSize = imageSizes.get(index);

                                    return (
                                        <Animated.View
                                            key={index}
                                            style={[
                                                styles.slide,
                                                { left: index * SCREEN_WIDTH },
                                                isCurrentImage && currentImageTransform,
                                            ]}
                                        >
                                            <View style={[
                                                styles.imageFrame,
                                                imageSize && { width: imageSize.width, height: imageSize.height }
                                            ]}>
                                                <Image
                                                    source={{ uri }}
                                                    style={styles.image}
                                                    resizeMode="contain"
                                                />
                                                {/* Watermark only on current image */}
                                                {isCurrentImage && renderWatermark && imageSize && (
                                                    <View style={styles.watermark}>
                                                        {renderWatermark(imageSize.width, imageSize.height)}
                                                    </View>
                                                )}
                                            </View>
                                        </Animated.View>
                                    );
                                })}
                            </Animated.View>
                        </Animated.View>
                    </GestureDetector>

                    {/* Navigation Buttons */}
                    {images.length > 1 && (
                        <View style={styles.navRow}>
                            <Pressable
                                onPress={goToPrevious}
                                disabled={currentIndex === 0}
                                style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
                            >
                                <Icon as={ChevronLeft} size={26} className="text-white" strokeWidth={2.5} />
                            </Pressable>
                            <Pressable
                                onPress={goToNext}
                                disabled={currentIndex === images.length - 1}
                                style={[styles.navBtn, currentIndex === images.length - 1 && styles.navBtnDisabled]}
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
        flexDirection: 'row',
    },
    slide: {
        position: 'absolute',
        width: SCREEN_WIDTH,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageFrame: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
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
