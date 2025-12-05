import { View, Modal, Dimensions, ActivityIndicator, Platform, ScrollView } from "react-native";
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
import Pdf from "react-native-pdf";

interface WaiverSignProps {
    visible: boolean;
    onClose: () => void;
    waiverUrl: string; // PDF file URL
    onSign: () => void;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const ANIMATION_DURATION = 100;

export const WaiverSign = ({ visible, onClose, waiverUrl, onSign }: WaiverSignProps) => {
    const [isRendered, setIsRendered] = useState(visible);
    const [pdfLoading, setPdfLoading] = useState(true);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState<number | null>(null);
    const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<('text' | 'signature') | null>(null);
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
            // Reset PDF state when modal opens
            setPdfLoading(true);
            setPdfError(null);
            setTotalPages(null);
            setPdfUri(null);

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

    const getContainerWidth = (pageNum: number) => {
        const containerWidth = screenWidth * pageNum;
        return containerWidth;
    };

    const handleEditMode = (mode: 'text' | 'signature') => {
        // Toggle: if the same mode is clicked, deactivate it; otherwise switch to the new mode
        setEditMode(editMode === mode ? null : mode);
    };

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

                        {/* PDF Viewer */}
                        <View className="flex-1" style={{ width: '100%' }}>
                            {pdfLoading && (
                                <View className="absolute inset-0 items-center justify-center z-10 bg-background">
                                    <ActivityIndicator size="large" />
                                    <Text className="mt-4 text-text-secondary">Loading PDF...</Text>
                                </View>
                            )}
                            {pdfError && (
                                <View className="flex-1 items-center justify-center p-4">
                                    <Text className="text-destructive text-center mb-4">{pdfError}</Text>
                                    <Button variant="outline" onPress={() => {
                                        setPdfError(null);
                                        setPdfLoading(true);
                                    }}>
                                        <Text>Retry</Text>
                                    </Button>
                                </View>
                            )}
                            {waiverUrl && (
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
                            )}

                            <View className="flex-row gap-2">
                                <Button 
                                    variant={editMode === 'text' ? 'default' : 'outline'} 
                                    onPress={() => handleEditMode('text')}
                                >
                                    <Text>Add Text</Text>
                                </Button>
                                <Button 
                                    variant={editMode === 'signature' ? 'default' : 'outline'} 
                                    onPress={() => handleEditMode('signature')}
                                >
                                    <Text>Add Signature</Text>
                                </Button>
                            </View>

                            {pdfUri && !pdfError && pdfDimensions && (
                                <View className="bg-red-500 w-full" style={{ height: pdfDimensions.height }}>
                                    <ScrollView
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        scrollEnabled={!editMode}
                                        contentContainerStyle={{ width: getContainerWidth(totalPages || 1)}}
                                    >
                                        <View style={{ position: 'relative', width: getContainerWidth(totalPages || 1), height: pdfDimensions.height }}>
                                            <View
                                                className="absolute top-0 left-0 right-0 bottom-0 z-10"
                                                style={{
                                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                    width: getContainerWidth(totalPages || 1),
                                                    height: pdfDimensions.height,
                                                }}
                                            >
                                            </View>
                                            <Pdf
                                                source={{
                                                    uri: waiverUrl,
                                                    cache: true,
                                                }}
                                                horizontal={true}
                                                trustAllCerts={false}
                                                onLoadComplete={() => {
                                                    setPdfLoading(false);
                                                }}
                                                onError={(error) => {
                                                    setPdfLoading(false);
                                                }}
                                                style={{
                                                    width: getContainerWidth(totalPages || 1),
                                                    height: pdfDimensions.height,
                                                    backgroundColor: '#05080F',
                                                }}
                                                enableDoubleTapZoom={false}
                                                scrollEnabled={false}
                                                enablePaging={false}
                                                spacing={0}
                                            />
                                        </View>
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
