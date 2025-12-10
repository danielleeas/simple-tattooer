import { View, Modal, Dimensions, ActivityIndicator, Platform, ScrollView, TextInput, TouchableOpacity, Image } from "react-native";
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

                            {/* Image Viewer */}
                            {fileType === 'image' && waiverUrl && !imageError && (
                                <ScrollView
                                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                                    maximumZoomScale={3}
                                    minimumZoomScale={1}
                                    showsVerticalScrollIndicator={false}
                                    showsHorizontalScrollIndicator={false}
                                >
                                    <Image
                                        source={{ uri: waiverUrl }}
                                        style={{
                                            width: screenWidth,
                                            height: screenHeight - top - bottom - 80,
                                        }}
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
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
