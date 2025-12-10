import React, { useState, useCallback } from 'react';
import { Modal, View, Image, Pressable, Dimensions, StyleSheet } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
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
    const [isZoomed, setIsZoomed] = useState(false);

    // Animated values for zoom and pan
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);
    const savedTranslationX = useSharedValue(0);
    const savedTranslationY = useSharedValue(0);

    const resetImageTransform = useCallback(() => {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translationX.value = withTiming(0);
        translationY.value = withTiming(0);
        savedTranslationX.value = 0;
        savedTranslationY.value = 0;
        setIsZoomed(false);
    }, []);

    const loadImageDimensions = useCallback((imageUri: string) => {
        Image.getSize(
            imageUri,
            (width, height) => {
                const aspectRatio = width / height;
                const maxWidth = SCREEN_WIDTH - 40;
                const maxHeight = SCREEN_HEIGHT - 100;

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
                setImageDimensions({ width: SCREEN_WIDTH - 40, height: SCREEN_HEIGHT - 100 });
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
            scale.value = Math.max(MIN_SCALE, Math.min(savedScale.value * event.scale, MAX_SCALE));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (scale.value < 1.1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                translationX.value = withSpring(0);
                translationY.value = withSpring(0);
                savedTranslationX.value = 0;
                savedTranslationY.value = 0;
                setIsZoomed(false);
            } else {
                setIsZoomed(true);
            }
        });

    // Pan gesture for dragging when zoomed
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (savedScale.value > 1) {
                // When zoomed, allow panning
                translationX.value = savedTranslationX.value + event.translationX;
                translationY.value = savedTranslationY.value + event.translationY;
            }
        })
        .onEnd(() => {
            savedTranslationX.value = translationX.value;
            savedTranslationY.value = translationY.value;
        });


    // Double tap to zoom
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((event) => {
            if (scale.value > 1) {
                // Zoom out
                scale.value = withTiming(1);
                savedScale.value = 1;
                translationX.value = withTiming(0);
                translationY.value = withTiming(0);
                savedTranslationX.value = 0;
                savedTranslationY.value = 0;
                setIsZoomed(false);
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
                setIsZoomed(true);
            }
        });

    // Compose gestures
    const composedGesture = Gesture.Race(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture)
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translationX.value },
            { translateY: translationY.value },
            { scale: scale.value },
        ],
    }));

    const handleClose = () => {
        resetImageTransform();
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.container}>
                    {/* Header with close button and counter */}
                    <View style={styles.header}>
                        <Text className="text-white text-lg font-semibold">
                            {currentIndex + 1} / {images.length}
                        </Text>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <Icon as={X} size={28} className="text-white" strokeWidth={2} />
                        </Pressable>
                    </View>

                    {/* Main image viewer */}
                    <View style={styles.imageContainer}>
                        <GestureDetector gesture={composedGesture}>
                            <Animated.View style={[animatedStyle, styles.imageWrapper]}>
                                {imageDimensions && (
                                    <View style={{ width: imageDimensions.width, height: imageDimensions.height, position: 'relative' }}>
                                        <Image
                                            source={{ uri: images[currentIndex] }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="contain"
                                        />
                                        {renderWatermark && !isZoomed && (
                                            <View style={styles.watermarkContainer}>
                                                {renderWatermark(imageDimensions.width, imageDimensions.height)}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </Animated.View>
                        </GestureDetector>
                    </View>

                    {/* Navigation arrows */}
                    {images.length > 1 && (
                        <View style={styles.navigationContainer}>
                            <Pressable
                                onPress={goToPreviousImage}
                                disabled={currentIndex === 0}
                                style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
                            >
                                <Icon as={ChevronLeft} size={32} className="text-white" strokeWidth={2} />
                            </Pressable>
                            <Pressable
                                onPress={goToNextImage}
                                disabled={currentIndex === images.length - 1}
                                style={[styles.navButton, currentIndex === images.length - 1 && styles.navButtonDisabled]}
                            >
                                <Icon as={ChevronRight} size={32} className="text-white" strokeWidth={2} />
                            </Pressable>
                        </View>
                    )}

                    {/* Instruction text */}
                    <View style={styles.instructionContainer}>
                        <Text className="text-white/70 text-sm text-center">
                            Pinch to zoom • Double tap to zoom • Use arrows to navigate
                        </Text>
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
    closeButton: {
        padding: 8,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    navigationContainer: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    navButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 30,
        padding: 12,
    },
    navButtonDisabled: {
        opacity: 0.3,
    },
    instructionContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
});
