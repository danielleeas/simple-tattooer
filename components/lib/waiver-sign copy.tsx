import { View, Modal, Dimensions, ActivityIndicator, Platform, ScrollView, TextInput, TouchableOpacity } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSpring,
    Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { X, Check, XCircle } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import Pdf from "react-native-pdf";

interface WaiverSignProps {
    visible: boolean;
    onClose: () => void;
    waiverUrl: string; // PDF file URL
    onSign: () => void;
}

interface TextAnnotation {
    id: string;
    page: number;
    x: number; // PDF coordinate (points)
    y: number; // PDF coordinate (points)
    text: string;
    screenX: number; // Screen coordinate for display
    screenY: number; // Screen coordinate for display
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
    const [currentScale, setCurrentScale] = useState<number>(1);
    const [pdfPageSize, setPdfPageSize] = useState<{ width: number; height: number } | null>(null);
    const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
    const [activeTextInput, setActiveTextInput] = useState<{ id: string; pdfX: number; pdfY: number; page: number } | null>(null);
    const [textInputValue, setTextInputValue] = useState<string>('');
    const pdfViewRef = useRef<View>(null);
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
        // Clear active text input when switching modes
        if (editMode !== mode) {
            setActiveTextInput(null);
            setTextInputValue('');
        }
    };

    // Convert PDF coordinates to screen coordinates
    // The coordinates from onPageSingleTap are in PDF coordinate space (points)
    // We need to convert them to screen coordinates accounting for zoom
    const pdfToScreenCoordinates = (pdfX: number, pdfY: number, page: number, pdfWidth: number, pdfHeight: number): { x: number; y: number } => {
        if (!pdfDimensions || !pdfPageSize) {
            return { x: 0, y: 0 };
        }

        // Calculate the scale factor between PDF size and displayed size (at base zoom = 1)
        // pdfDimensions is the displayed size when the PDF is fitted to screen width
        const baseScaleX = pdfDimensions.width / pdfWidth;
        const baseScaleY = pdfDimensions.height / pdfHeight;
        
        // Apply the current zoom scale
        const finalScaleX = baseScaleX * currentScale;
        const finalScaleY = baseScaleY * currentScale;

        // Convert PDF coordinates to screen coordinates
        // PDF coordinates from onPageSingleTap: typically in PDF points
        // PDF coordinate system: origin at bottom-left, Y increases upward
        // Screen coordinate system: origin at top-left, Y increases downward
        
        // Scale the coordinates
        const screenX = pdfX * finalScaleX;
        // Invert Y coordinate: PDF has origin at bottom-left, screen at top-left
        const screenY = (pdfHeight - pdfY) * finalScaleY;

        console.log('Coordinate conversion:', {
            input: { pdfX, pdfY },
            pdfSize: { pdfWidth, pdfHeight },
            displaySize: pdfDimensions,
            scale: currentScale,
            scales: { baseScaleX, baseScaleY, finalScaleX, finalScaleY },
            output: { screenX, screenY }
        });

        return { x: screenX, y: screenY };
    };

    // Handle PDF tap
    const handlePdfTap = (page: number, x: number, y: number) => {
        if (editMode !== 'text') {
            return;
        }

        if (!pdfPageSize || !pdfDimensions) {
            console.warn('PDF dimensions not available');
            return;
        }

        // Log the raw coordinates for debugging
        console.log('PDF Tap - Raw coordinates:', { page, x, y });
        console.log('PDF Page Size:', pdfPageSize);
        console.log('PDF Display Dimensions:', pdfDimensions);
        console.log('Current Scale:', currentScale);

        // Test: Check if coordinates are already in screen space
        // If x and y are within screen bounds, they might be screen coordinates
        const mightBeScreenCoords = x >= 0 && x <= screenWidth && y >= 0 && y <= pdfDimensions.height;
        console.log('Might be screen coordinates?', mightBeScreenCoords, 'x range: 0-', screenWidth, 'y range: 0-', pdfDimensions.height);

        // x, y from onPageSingleTap are typically in PDF coordinate space (points)
        // PDF coordinate system: origin at bottom-left, Y increases upward
        // Store PDF coordinates directly - they are zoom-independent
        const newId = `text-${Date.now()}`;
        setActiveTextInput({
            id: newId,
            pdfX: x,
            pdfY: y,
            page: page,
        });
        setTextInputValue('');
    };

    // Save text annotation
    const handleSaveText = () => {
        if (!activeTextInput || !textInputValue.trim() || !pdfPageSize || !pdfDimensions) {
            return;
        }

        // activeTextInput already has PDF coordinates
        const screenCoords = pdfToScreenCoordinates(
            activeTextInput.pdfX,
            activeTextInput.pdfY,
            activeTextInput.page,
            pdfPageSize.width,
            pdfPageSize.height
        );

        const newAnnotation: TextAnnotation = {
            id: activeTextInput.id,
            page: activeTextInput.page,
            x: activeTextInput.pdfX,
            y: activeTextInput.pdfY,
            text: textInputValue,
            screenX: screenCoords.x,
            screenY: screenCoords.y,
        };

        setTextAnnotations([...textAnnotations, newAnnotation]);
        setActiveTextInput(null);
        setTextInputValue('');
    };

    // Cancel text input
    const handleCancelText = () => {
        setActiveTextInput(null);
        setTextInputValue('');
    };

    // Update screen coordinates for annotations when scale changes
    useEffect(() => {
        if (pdfPageSize && pdfDimensions && textAnnotations.length > 0) {
            const updatedAnnotations = textAnnotations.map(annotation => {
                const screenCoords = pdfToScreenCoordinates(
                    annotation.x,
                    annotation.y,
                    annotation.page,
                    pdfPageSize.width,
                    pdfPageSize.height
                );
                return {
                    ...annotation,
                    screenX: screenCoords.x,
                    screenY: screenCoords.y,
                };
            });
            setTextAnnotations(updatedAnnotations);
        }
    }, [currentScale]);

    // Get screen coordinates for active text input (recalculated on zoom)
    const getActiveTextInputScreenCoords = (): { x: number; y: number } | null => {
        if (!activeTextInput || !pdfPageSize || !pdfDimensions) {
            return null;
        }
        
        // Try using coordinates directly first (they might already be in screen space)
        // Check if the stored coordinates look like screen coordinates
        const storedX = activeTextInput.pdfX;
        const storedY = activeTextInput.pdfY;
        
        // If coordinates are within reasonable screen bounds, use them directly
        // Otherwise, convert from PDF coordinates
        if (storedX >= 0 && storedX <= screenWidth * 1.5 && storedY >= 0 && storedY <= pdfDimensions.height * 1.5) {
            console.log('Using stored coordinates as screen coordinates:', { storedX, storedY });
            return { x: storedX, y: storedY };
        }
        
        // Convert from PDF coordinates
        return pdfToScreenCoordinates(
            activeTextInput.pdfX,
            activeTextInput.pdfY,
            activeTextInput.page,
            pdfPageSize.width,
            pdfPageSize.height
        );
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
                        <View className="flex-row items-center justify-between p-4">
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

                            <View className="flex-row gap-2 pb-1">
                                <View className="flex-row gap-2 flex-1">
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

                                <Button
                                    variant="outline"
                                    disabled={!editMode}
                                >
                                    <Text>Save</Text>
                                </Button>
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
                                            setPdfPageSize({ width: screenWidth, height: size.height });
                                        }}
                                        onError={(error) => {
                                            setPdfLoading(false);
                                        }}
                                        onPageSingleTap={(page, x, y) => {
                                            console.log(`=== PDF TAP EVENT ===`);
                                            console.log(`Page: ${page}`);
                                            console.log(`Raw X: ${x}, Raw Y: ${y}`);
                                            console.log(`PDF Page Size:`, pdfPageSize);
                                            console.log(`PDF Display Dimensions:`, pdfDimensions);
                                            console.log(`Current Scale:`, currentScale);
                                            console.log(`Screen Width: ${screenWidth}`);
                                            handlePdfTap(page, x, y);
                                        }}
                                        onScaleChanged={(scale) => {
                                            console.log(`Scale changed ===========================: ${scale}`);
                                            setCurrentScale(scale);
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
                                    {/* Text Annotations Overlay */}
                                    {textAnnotations.map((annotation) => (
                                        <View
                                            key={annotation.id}
                                            style={{
                                                position: 'absolute',
                                                left: annotation.screenX,
                                                top: annotation.screenY,
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                padding: 4,
                                                borderRadius: 4,
                                                maxWidth: 200,
                                                zIndex: 10,
                                            }}
                                        >
                                            <Text style={{ fontSize: 12, color: '#000' }}>
                                                {annotation.text}
                                            </Text>
                                        </View>
                                    ))}
                                    {/* Active Text Input Overlay */}
                                    {activeTextInput && (() => {
                                        const screenCoords = getActiveTextInputScreenCoords();
                                        if (!screenCoords) return null;
                                        return (
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    left: Math.max(0, Math.min(screenCoords.x, screenWidth - 250)),
                                                    top: Math.max(0, screenCoords.y - 40),
                                                    backgroundColor: 'white',
                                                    borderRadius: 8,
                                                    padding: 8,
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.25,
                                                    shadowRadius: 3.84,
                                                    elevation: 5,
                                                    zIndex: 20,
                                                    width: 250,
                                                }}
                                            >
                                            <TextInput
                                                value={textInputValue}
                                                onChangeText={setTextInputValue}
                                                placeholder="Enter text..."
                                                autoFocus
                                                style={{
                                                    borderWidth: 1,
                                                    borderColor: '#ddd',
                                                    borderRadius: 4,
                                                    padding: 8,
                                                    fontSize: 14,
                                                    color: '#000',
                                                    minHeight: 40,
                                                }}
                                                multiline
                                            />
                                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 8 }}>
                                                <TouchableOpacity
                                                    onPress={handleCancelText}
                                                    style={{
                                                        padding: 6,
                                                        borderRadius: 4,
                                                    }}
                                                >
                                                    <Icon as={XCircle} size={20} className="text-destructive" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={handleSaveText}
                                                    style={{
                                                        padding: 6,
                                                        borderRadius: 4,
                                                    }}
                                                    disabled={!textInputValue.trim()}
                                                >
                                                    <Icon as={Check} size={20} className={textInputValue.trim() ? "text-success" : "text-muted-foreground"} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        );
                                    })()}
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
