import { View, Modal, Dimensions, ActivityIndicator, Platform, ScrollView, TextInput, TouchableOpacity, Image, Pressable } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSpring,
    Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { X, ZoomIn, ZoomOut, Maximize2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import Pdf from "react-native-pdf";

interface WaiverSignProps {
    visible: boolean;
    onClose: () => void;
    waiverUrl: string; // PDF or image file URL
}

type FileType = 'pdf' | 'image' | 'unknown';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const ANIMATION_DURATION = 100;

// Helper function to detect file type from URL
const getFileType = (url: string): FileType => {
    if (!url) return 'unknown';

    const urlLower = url.toLowerCase();

    // Check for image extensions
    if (urlLower.match(/\.(jpg|jpeg|png|gif|bmp|webp)(\?|$)/i)) {
        return 'image';
    }

    // Check for PDF extension
    if (urlLower.match(/\.pdf(\?|$)/i)) {
        return 'pdf';
    }

    // Check URL path patterns (e.g., Supabase storage)
    if (urlLower.includes('.pdf')) return 'pdf';
    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('.png')) return 'image';

    return 'unknown';
};

export const WaiverView = ({ visible, onClose, waiverUrl }: WaiverSignProps) => {
    const [isRendered, setIsRendered] = useState(visible);
    const [fileType, setFileType] = useState<FileType>('unknown');
    const [pdfLoading, setPdfLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(true);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState<number | null>(null);
    const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const translateY = useSharedValue(screenHeight);
    const backdropOpacity = useSharedValue(0);
    const { top, bottom } = useSafeAreaInsets();

    // Image zoom and pan state
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY2 = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Logging functions for gestures (must use runOnJS)
    const logPinch = (scaleValue: number) => {
        console.log('Pinch scale:', scaleValue);
    };

    const logPinchEnd = (scaleValue: number) => {
        console.log('Pinch end scale:', scaleValue);
    };

    const logPan = (x: number, y: number) => {
        console.log('Pan translation:', x, y);
    };

    const logPanEnd = (x: number, y: number) => {
        console.log('Pan end translation:', x, y);
    };

    const logDoubleTap = () => {
        console.log('Double tap detected - resetting zoom');
    };

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

            // Detect file type from URL
            const detectedFileType = getFileType(waiverUrl);
            setFileType(detectedFileType);

            // Reset state based on file type
            if (detectedFileType === 'pdf') {
                setPdfLoading(true);
                setPdfError(null);
                setTotalPages(null);
                setPdfUri(null);
            } else if (detectedFileType === 'image') {
                setImageLoading(true);
                setImageError(null);
                // Reset zoom and pan for image
                scale.value = 1;
                savedScale.value = 1;
                translateX.value = 0;
                translateY2.value = 0;
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            }

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
    }, [visible, waiverUrl]);

    const modalStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    // Pinch gesture for zooming
    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            // Limit zoom between 1x and 3x
            if (scale.value < 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                translateX.value = withSpring(0);
                translateY2.value = withSpring(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else if (scale.value > 3) {
                scale.value = withSpring(3);
                savedScale.value = 3;
            } else {
                savedScale.value = scale.value;
            }
        });

    // Pan gesture for moving zoomed image (works with mouse drag on emulator)
    const panGesture = Gesture.Pan()
        .minPointers(1)
        .maxPointers(1)
        .activeOffsetX([-10, 10]) // Require 10px movement to activate
        .activeOffsetY([-10, 10])
        .onUpdate((e) => {
            // Only allow panning when zoomed in
            if (savedScale.value > 1) {
                translateX.value = savedTranslateX.value + e.translationX;
                translateY2.value = savedTranslateY.value + e.translationY;
            }
        })
        .onEnd(() => {
            if (savedScale.value > 1) {
                savedTranslateX.value = translateX.value;
                savedTranslateY.value = translateY2.value;
            }
        });

    // Double tap to reset zoom
    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            scale.value = withSpring(1);
            savedScale.value = 1;
            translateX.value = withSpring(0);
            translateY2.value = withSpring(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
        });

    // Combine gestures - Pan and Pinch can happen simultaneously
    const composedGesture = Gesture.Race(
        doubleTap,
        Gesture.Simultaneous(pinchGesture, panGesture)
    );

    // Animated style for image with zoom and pan
    const imageAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY2.value },
                { scale: scale.value },
            ],
        };
    });

    // Test controls for emulator (can be removed after testing)
    const handleZoomIn = () => {
        const newScale = Math.min(scale.value + 0.5, 3);
        scale.value = withSpring(newScale);
        savedScale.value = newScale;
    };

    const handleZoomOut = () => {
        const newScale = Math.max(scale.value - 0.5, 1);
        scale.value = withSpring(newScale);
        savedScale.value = newScale;

        // Reset position if zoomed out to 1x
        if (newScale === 1) {
            translateX.value = withSpring(0);
            translateY2.value = withSpring(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
        }
    };

    const handleResetZoom = () => {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY2.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
    };

    const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
        const panAmount = 50;
        switch (direction) {
            case 'up':
                translateY2.value = withSpring(translateY2.value + panAmount);
                savedTranslateY.value = translateY2.value;
                break;
            case 'down':
                translateY2.value = withSpring(translateY2.value - panAmount);
                savedTranslateY.value = translateY2.value;
                break;
            case 'left':
                translateX.value = withSpring(translateX.value + panAmount);
                savedTranslateX.value = translateX.value;
                break;
            case 'right':
                translateX.value = withSpring(translateX.value - panAmount);
                savedTranslateX.value = translateX.value;
                break;
        }
    };

    if (!isRendered) return null;

    return (
        <Modal visible={visible} onRequestClose={handleClose} transparent animationType="none">
            <GestureHandlerRootView style={{ flex: 1 }}>
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
                        <View className="flex-row items-center justify-between p-4">
                            <Text variant="h6" className="leading-tight">Sign Waiver Agreement</Text>
                            <Button variant="ghost" size="icon" onPress={handleClose}>
                                <Icon as={X} size={24} />
                            </Button>
                        </View>

                        {/* File Viewer (PDF or Image) */}
                        <View className="flex-1" style={{ width: '100%' }}>
                            {/* Loading State */}
                            {((fileType === 'pdf' && pdfLoading) || (fileType === 'image' && imageLoading)) && (
                                <View className="absolute inset-0 items-center justify-center z-10 bg-background">
                                    <ActivityIndicator size="large" />
                                    <Text className="mt-4 text-text-secondary">
                                        Loading {fileType === 'pdf' ? 'PDF' : 'Image'}...
                                    </Text>
                                </View>
                            )}

                            {/* Error State */}
                            {(pdfError || imageError) && (
                                <View className="flex-1 items-center justify-center p-4">
                                    <Text className="text-destructive text-center mb-4">
                                        {pdfError || imageError}
                                    </Text>
                                    <Button variant="outline" onPress={() => {
                                        setPdfError(null);
                                        setImageError(null);
                                        if (fileType === 'pdf') {
                                            setPdfLoading(true);
                                        } else if (fileType === 'image') {
                                            setImageLoading(true);
                                        }
                                    }}>
                                        <Text>Retry</Text>
                                    </Button>
                                </View>
                            )}

                            {/* PDF Viewer */}
                            {fileType === 'pdf' && waiverUrl && (
                                <>
                                    <View className="absolute flex-1 top-0 left-0 right-0 bottom-0 opacity-0">
                                        <Pdf
                                            source={{
                                                uri: waiverUrl,
                                                cache: true,
                                            }}
                                            horizontal={true}
                                            trustAllCerts={false}
                                            fitPolicy={2} // 0 = fit width, 1 = fit height, 2 = fit both
                                            onLoadComplete={(numberOfPages, path, size) => {
                                                setPdfError(null);
                                                setTotalPages(numberOfPages);
                                                setPdfUri(path);
                                                setPdfDimensions({ width: screenWidth, height: (screenWidth / size.width) * size.height });
                                                console.log('PDF loaded with', numberOfPages, 'pages', path, size);
                                            }}
                                            onPageChanged={(page, numberOfPages) => {
                                                console.log(`Current page: ${page}`);
                                            }}
                                            onPageSingleTap={(page, x, y) => {
                                                console.log(`Single tap on page: ${page}, x: ${x}, y: ${y}`);
                                            }}
                                            onError={(error) => {
                                                setPdfError('Failed to load PDF. Please try again.');
                                                console.error('PDF Error:', error);
                                            }}
                                            style={{
                                                flex: 1,
                                                width: 200,
                                                backgroundColor: '#05080F',
                                            }}
                                            enablePaging={true}
                                            spacing={10}
                                        />
                                    </View>

                                    {pdfUri && !pdfError && pdfDimensions && (
                                        <View className="w-full relative" style={{ height: pdfDimensions.height }}>
                                            <Pdf
                                                source={{
                                                    uri: waiverUrl,
                                                    cache: true,
                                                }}
                                                horizontal={true}
                                                trustAllCerts={false}
                                                onLoadComplete={(numberOfPages, path, size) => {
                                                    setPdfLoading(false);
                                                }}
                                                onError={(error) => {
                                                    setPdfLoading(false);
                                                }}
                                                style={{
                                                    width: screenWidth,
                                                    height: pdfDimensions.height,
                                                    backgroundColor: '#05080F',
                                                }}
                                                enableDoubleTapZoom={true}
                                                scrollEnabled={true}
                                                enablePaging={true}
                                                spacing={0}
                                            />
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Image Viewer with Pinch-to-Zoom */}
                            {fileType === 'image' && waiverUrl && !imageError && (
                                <>
                                    <View className="flex-1 items-center justify-center" style={{ width: screenWidth }}>
                                        <GestureDetector gesture={composedGesture}>
                                            <Animated.View style={{ width: screenWidth, height: screenHeight - top - bottom - 200 }}>
                                                <Animated.Image
                                                    source={{ uri: waiverUrl }}
                                                    style={[
                                                        {
                                                            width: screenWidth,
                                                            height: screenHeight - top - bottom - 200,
                                                        },
                                                        imageAnimatedStyle,
                                                    ]}
                                                    resizeMode="contain"
                                                    onLoadStart={() => {
                                                        setImageLoading(true);
                                                        setImageError(null);
                                                    }}
                                                    onLoad={() => {
                                                        setImageLoading(false);
                                                    }}
                                                    onError={() => {
                                                        setImageLoading(false);
                                                        setImageError('Failed to load image. Please try again.');
                                                    }}
                                                />
                                            </Animated.View>
                                        </GestureDetector>
                                    </View>

                                    {/* Test Controls for Emulator - Remove after testing */}
                                    <View className="absolute bottom-0 left-0 right-0 bg-background-secondary p-4 border-t border-border">
                                        <Text className="text-xs text-text-secondary text-center mb-3">Emulator Test Controls</Text>

                                        {/* Zoom Controls */}
                                        <View className="flex-row justify-center items-center gap-3 mb-3">
                                            <Pressable
                                                onPress={handleZoomOut}
                                                className="bg-background border border-border rounded-lg p-3 active:opacity-70"
                                            >
                                                <Icon as={ZoomOut} size={20} />
                                            </Pressable>

                                            <Pressable
                                                onPress={handleResetZoom}
                                                className="bg-background border border-border rounded-lg p-3 active:opacity-70"
                                            >
                                                <Icon as={Maximize2} size={20} />
                                            </Pressable>

                                            <Pressable
                                                onPress={handleZoomIn}
                                                className="bg-background border border-border rounded-lg p-3 active:opacity-70"
                                            >
                                                <Icon as={ZoomIn} size={20} />
                                            </Pressable>
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </View>
            </GestureHandlerRootView>
        </Modal>
    );
};
