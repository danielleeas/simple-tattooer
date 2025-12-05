import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Pressable, Platform, type ImageStyle, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as ExpoImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// Custom Components
import { Icon } from '@/components/ui/icon';
import { Pencil, Trash } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/contexts';
import { compressImage } from '@/lib/utils';

import UPLOAD from '@/assets/images/icons/upload.png';

const ICON_STYLE: ImageStyle = {
    height: 42,
    width: 42,
};

interface AvatarPickerProps {
    onImageSelected?: (uri: string) => void;
    onImageRemoved?: () => void;
    initialImage?: string | null;
    aspect?: [number, number] | undefined;
    quality?: number;
    allowsEditing?: boolean;
    placeholder?: string;
    helperText?: string;
    className?: string;
    error?: boolean;
    isCircle?: boolean;
    maxFileSize?: number; // in bytes, default 5MB
    allowedFileTypes?: string[]; // default ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    onValidationError?: (error: string) => void;
    // Optional: override crop handling (e.g., Android system cropper). Return new URI to update image.
    onRequestCrop?: (uri: string) => Promise<string | null | void> | string | null | void;
}

export function AvatarPicker({
    onImageSelected,
    onImageRemoved,
    initialImage = null,
    aspect,
    quality = 0.6,
    allowsEditing = true,
    placeholder = "Select an image",
    helperText,
    error = false,
    className,
    isCircle = false,
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    onValidationError,
    onRequestCrop,
}: AvatarPickerProps) {
    const [image, setImage] = useState<string | null>(initialImage);
    const [loading, setLoading] = useState(false);
    const [optionOpen, setOptionOpen] = useState(false);
    const [cropVisible, setCropVisible] = useState(false);
    const [originalSize, setOriginalSize] = useState<{ width: number; height: number } | null>(null);
    const { toast } = useToast();
    const shouldUseCircleDisplay = isCircle || (!!aspect && aspect.length === 2 && aspect[0] === 1 && aspect[1] === 1);

    // Update image when initialImage prop changes
    useEffect(() => {
        console.log('PhotoPicker initialImage changed:', initialImage);
        setImage(initialImage);
    }, [initialImage]);

    // Helper function to calculate file size from base64 string
    const getBase64FileSize = (base64String: string): number => {
        // Remove data URI prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        if (!base64Data) return 0;

        // Calculate size: base64 encoding increases size by ~33%
        // Formula: (base64String.length * 3) / 4 - padding
        const padding = (base64Data.match(/=/g) || []).length;
        return (base64Data.length * 3) / 4 - padding;
    };

    // Helper function to format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Validation functions
    const validateImageFile = async (uri: string): Promise<{ isValid: boolean; error?: string }> => {
        try {
            // Check if it's a base64 data URI
            if (uri.startsWith('data:image/')) {
                // Extract MIME type from base64 data URI
                const mimeTypeMatch = uri.match(/^data:(image\/\w+);base64,/);
                if (!mimeTypeMatch) {
                    return {
                        isValid: false,
                        error: 'Invalid base64 image format'
                    };
                }

                const mimeType = mimeTypeMatch[1];

                // Check if MIME type is allowed
                if (!allowedFileTypes.includes(mimeType)) {
                    return {
                        isValid: false,
                        error: `File type ${mimeType} is not supported. Allowed types: ${allowedFileTypes.join(', ')}`
                    };
                }

                // Check file size for base64 URIs
                const fileSize = getBase64FileSize(uri);
                if (fileSize > maxFileSize) {
                    return {
                        isValid: false,
                        error: `File size (${formatFileSize(fileSize)}) exceeds the maximum allowed size of ${formatFileSize(maxFileSize)}`
                    };
                }

                return { isValid: true };
            }

            // For web platform, we can't use FileSystem.getInfoAsync
            if (Platform.OS === 'web') {
                // Basic validation for web - check file extension
                const extension = uri.split('.').pop()?.toLowerCase();

                // Map MIME types to their common file extensions
                const mimeToExtensions: { [key: string]: string[] } = {
                    'image/jpeg': ['jpg', 'jpeg'],
                    'image/png': ['png'],
                    'image/gif': ['gif'],
                    'image/webp': ['webp']
                };

                const validExtensions = allowedFileTypes.flatMap(type => mimeToExtensions[type] || []);

                if (extension && !validExtensions.includes(extension)) {
                    return {
                        isValid: false,
                        error: `File type .${extension} is not supported. Allowed types: ${validExtensions.join(', ')}`
                    };
                }

                // For web, file size validation is limited as we can't access file info from URI
                // The expo-image-picker should handle basic size constraints at the selection level
                // Note: This is a limitation of web platform - consider implementing file size check
                // at the input level if needed for web applications
                return { isValid: true };
            }

            // Native platform validation - expo-image-picker returns base64 URIs on all platforms
            // For base64 URIs, we can't use FileSystem.getInfoAsync as it expects file paths
            // The validation (file type and size) is already handled above in the base64 data URI section

            return { isValid: true };
        } catch (error) {
            console.error('Error validating image:', error);
            return { isValid: false, error: 'Failed to validate image file' };
        }
    };

    const handleValidationError = (error: string) => {
        let customMessage = error;

        // Customize error messages for better user experience
        if (error.includes('File type') && error.includes('is not supported')) {
            customMessage = 'Please select a valid image format (JPEG, PNG, GIF, or WebP)';
        } else if (error.includes('File size') && error.includes('exceeds the maximum')) {
            customMessage = `Image file is too large. Maximum size allowed is ${formatFileSize(maxFileSize)}`;
        } else if (error.includes('Invalid base64 image format')) {
            customMessage = 'The selected image file is corrupted or invalid';
        } else if (error.includes('Failed to validate image file')) {
            customMessage = 'Unable to process the selected image. Please try a different file';
        }

        toast({
            title: 'Invalid Image',
            description: customMessage,
            variant: 'error',
        });
        onValidationError?.(error);
    };

    const requestPermissions = async () => {
        const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toast({
                title: 'Permission Required',
                description: 'Sorry, we need camera roll permissions to make this work!',
                variant: 'error',
            });
            return false;
        }
        return true;
    };

    const pickImage = async () => {
        setOptionOpen(false)
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            setLoading(false);
            return;
        }

        try {
            const result = await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality,
            });

            if (!result.canceled && result.assets[0]) {
                const selectedImage = result.assets[0].uri;

                // Validate the selected image
                const validation = await validateImageFile(selectedImage);
                if (!validation.isValid) {
                    handleValidationError(validation.error || 'Invalid image file');
                    setLoading(false);
                    return;
                }

                // Open custom cropper instead of compressing immediately
                setImage(selectedImage);
                Image.getSize(
                    selectedImage,
                    (width, height) => {
                        setOriginalSize({ width, height });
                        setCropVisible(true);
                    },
                    () => {
                        setOriginalSize(null);
                        setCropVisible(true);
                    }
                );
            }
        } catch (error) {
            console.error('Error picking image:', error);
            toast({
                title: 'Error',
                description: 'Failed to pick image. Please try again.',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const takePhoto = async () => {
        setOptionOpen(false)
        const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            toast({
                title: 'Permission Required',
                description: 'Sorry, we need camera permissions to make this work!',
                variant: 'error',
            });
            setLoading(false);
            return;
        }

        try {
            const result = await ExpoImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality,
            });

            if (!result.canceled && result.assets[0]) {
                const selectedImage = result.assets[0].uri;

                // Validate the captured image
                const validation = await validateImageFile(selectedImage);
                if (!validation.isValid) {
                    handleValidationError(validation.error || 'Invalid image file');
                    setLoading(false);
                    return;
                }

                // Open custom cropper instead of compressing immediately
                setImage(selectedImage);
                Image.getSize(
                    selectedImage,
                    (width, height) => {
                        setOriginalSize({ width, height });
                        setCropVisible(true);
                    },
                    () => {
                        setOriginalSize(null);
                        setCropVisible(true);
                    }
                );
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            toast({
                title: 'Error',
                description: 'Failed to take photo. Please try again.',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const removeImage = () => {
        setImage(null);
        onImageRemoved?.();
    };

    const handleOptionModal = (isOpen: boolean) => {
        setOptionOpen(isOpen);
        setLoading(isOpen);
    };

    const openEditModal = async () => {
        if (!image) return;
        // If consumer provided system/native cropper, delegate first
        if (onRequestCrop) {
            try {
                const maybeUri = await onRequestCrop(image);
                if (typeof maybeUri === 'string' && maybeUri) {
                    const compressed = await compressImage(maybeUri, quality);
                    setImage(compressed);
                    onImageSelected?.(compressed);
                    return;
                }
                // if null/undefined returned, fall through to built-in cropper
            } catch (e) {
                console.error('onRequestCrop failed, falling back to built-in cropper', e);
            }
        }

        // Built-in cropper fallback
        Image.getSize(
            image,
            (width, height) => {
                setOriginalSize({ width, height });
                setCropVisible(true);
            },
            () => {
                setOriginalSize(null);
                setCropVisible(true);
            }
        );
    };

    const onCropDone = async (croppedUri: string) => {
        // Optionally compress after crop
        const compressed = await compressImage(croppedUri, quality);
        setImage(compressed);
        onImageSelected?.(compressed);
        setCropVisible(false);
    };

    const onCropCancel = () => {
        setCropVisible(false);
    };

    return (
        <View className={cn("h-48 w-full", className)}>
            {image ? (
                shouldUseCircleDisplay ? (
                    <View className='w-full h-full items-center justify-center' style={{ position: 'relative' }}>
                        <View className='w-48 h-48 rounded-full overflow-hidden'>
                            <Image source={{ uri: image }} className='w-full h-full' />
                        </View>
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.9)']}
                            locations={[0, 1]}
                            className="absolute bottom-0 right-0 w-full h-20 flex-row items-end justify-center z-10"
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                width: '100%',
                                height: 80,
                                flexDirection: 'row',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingBottom: 8,
                            }}
                        >
                            <Button variant="link" style={{ paddingRight: 10 }} onPress={openEditModal}>
                                <Icon as={Pencil} size={20} />
                                <Text>Edit</Text>
                            </Button>
                            <Button variant="link" style={{ paddingLeft: 10 }} onPress={() => image && removeImage()}>
                                <Icon as={Trash} size={20} />
                                <Text>Delete</Text>
                            </Button>
                        </LinearGradient>
                    </View>
                ) : (
                    <View className='w-full h-full rounded-xl overflow-hidden' style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                        <Image source={{ uri: image }} className='w-full h-full' />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.9)']}
                            locations={[0, 1]}
                            className="absolute bottom-0 right-0 w-full h-20 flex-row items-end justify-center z-10"
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                width: '100%',
                                height: 80,
                                flexDirection: 'row',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingBottom: 8,
                            }}
                        >
                            <Button variant="link" style={{ paddingRight: 10 }} onPress={openEditModal}>
                                <Icon as={Pencil} size={20} />
                                <Text>Edit</Text>
                            </Button>
                            <Button variant="link" style={{ paddingLeft: 10 }} onPress={() => image && removeImage()}>
                                <Icon as={Trash} size={20} />
                                <Text>Delete</Text>
                            </Button>
                        </LinearGradient>
                    </View>
                )
            ) : (
                <Pressable
                    onPress={() => handleOptionModal(true)}
                    disabled={loading}
                    className='w-full h-full py-4 px-5 border border-dashed border-border rounded-xl items-center justify-center'
                >
                    <View style={{ position: 'relative' }}>
                        <View className='w-20 h-20 flex items-center bg-background-secondary border border-border justify-center rounded-full mb-2'>
                            <Image source={UPLOAD} style={ICON_STYLE} />
                        </View>
                    </View>
                    <Text
                        className={cn(error ? "text-destructive" : "text-text-secondary", "text-sm")}
                    >
                        {loading ? 'Selecting...' : placeholder}
                    </Text>
                    {helperText && (
                        <Text
                            className={cn(error ? "text-destructive" : "text-text-tertiary", "text-xs mt-1")}
                        >
                            {helperText}
                        </Text>
                    )}
                </Pressable>
            )}
            <Modal
                visible={optionOpen}
                transparent
                animationType="fade"
                onRequestClose={() => handleOptionModal(false)}
            >
                <View className="flex-1 justify-center p-4">
                    <Pressable
                        className="absolute inset-0 bg-black/50"
                        onPress={() => handleOptionModal(false)}
                    />
                    <View className="bg-background-secondary p-4 rounded-2xl">
                        <View className="mb-2">
                            <Text className="text-lg font-semibold">Select Image</Text>
                            <Text className="text-text-secondary mt-1">Choose how you want to add an image</Text>
                        </View>
                        <View className='flex-row gap-2 items-center justify-center'>
                            <Button variant="outline" onPress={takePhoto}>
                                <Text>Camera</Text>
                            </Button>
                            <Button variant="outline" onPress={pickImage}>
                                <Text>Photo Library</Text>
                            </Button>
                            <Button variant="outline" onPress={() => handleOptionModal(false)}>
                                <Text>Cancel</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Cropper Modal */}
            <Modal
                visible={!!image && cropVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCropVisible(false)}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <View className="flex-1 bg-black/90">
                        {image && (
                            <RectCropperContent
                                uri={image}
                                aspect={aspect}
                                originalSize={originalSize}
                                quality={quality}
                                onCancel={onCropCancel}
                                onDone={onCropDone}
                                isCircle={isCircle}
                            />
                        )}
                    </View>
                </GestureHandlerRootView>
            </Modal>
        </View>
    );
}

interface CropperContentProps {
    uri: string;
    aspect?: [number, number];
    originalSize: { width: number; height: number } | null;
    quality: number;
    onCancel: () => void;
    onDone: (uri: string) => void;
    isCircle?: boolean;
}

function RectCropperContent({ uri, aspect, originalSize, quality, onCancel, onDone, isCircle = false }: CropperContentProps) {
    const { toast } = useToast();
    const [isCropping, setIsCropping] = useState(false);
    const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null);
    const [optimalViewSize, setOptimalViewSize] = useState<{ width: number; height: number } | null>(null);
    const displayRef = useRef({ dx: 0, dy: 0, dispW: 0, dispH: 0, scale: 1 });
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    // Rectangle in frame coordinates
    const rectX = useSharedValue(0);
    const rectY = useSharedValue(0);
    const rectW = useSharedValue(0);
    const rectH = useSharedValue(0);
    const startX = useSharedValue(0);
    const startY = useSharedValue(0);
    const startW = useSharedValue(0);
    const startH = useSharedValue(0);

    // Frame absolute coordinates relative to the modal content (for overlays)
    const frameX = useSharedValue(0);
    const frameY = useSharedValue(0);
    const frameW = useSharedValue(0);
    const frameH = useSharedValue(0);

    const onFrameLayout = (e: any) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        setFrameSize({ width, height });
        frameX.value = x; frameY.value = y; frameW.value = width; frameH.value = height;
        if (!originalSize) return;

        // Contain the image fully inside the frame
        const scale = Math.min(width / originalSize.width, height / originalSize.height);
        const dispW = originalSize.width * scale;
        const dispH = originalSize.height * scale;
        const dx = (width - dispW) / 2;
        const dy = (height - dispH) / 2;
        displayRef.current = { dx, dy, dispW, dispH, scale };

        // Initialize rect centered within the visible image
        const ar = aspect && aspect.length === 2 ? aspect[0] / aspect[1] : null;
        const minSize = 40;
        let initW = dispW;
        let initH = dispH;
        if (ar) {
            const frameAR = dispW / dispH;
            if (frameAR > ar) {
                // Limited by height
                initH = dispH;
                initW = initH * ar;
            } else {
                // Limited by width
                initW = dispW;
                initH = initW / ar;
            }
        }
        // Enforce a minimum size
        initW = Math.max(minSize, initW);
        initH = Math.max(minSize, initH);
        rectW.value = initW;
        rectH.value = initH;
        rectX.value = dx + (dispW - initW) / 2;
        rectY.value = dy + (dispH - initH) / 2;
    };

    const frameWidth = frameSize?.width ?? 0;
    const frameHeight = frameSize?.height ?? 0;

    const clampRect = () => {
        'worklet';
        const minSize = 40;
        rectW.value = Math.max(minSize, Math.min(rectW.value, frameWidth));
        rectH.value = Math.max(minSize, Math.min(rectH.value, frameHeight));
        rectX.value = Math.min(Math.max(0, rectX.value), Math.max(0, frameWidth - rectW.value));
        rectY.value = Math.min(Math.max(0, rectY.value), Math.max(0, frameHeight - rectH.value));
    };

    // Move rectangle
    const dragRect = Gesture.Pan()
        .onBegin(() => {
            startX.value = rectX.value;
            startY.value = rectY.value;
        })
        .onChange((e) => {
            rectX.value = startX.value + e.translationX;
            rectY.value = startY.value + e.translationY;
            clampRect();
        });

    // Desired aspect ratio (if provided)
    const desiredAspect = aspect && aspect.length === 2 ? aspect[0] / aspect[1] : null;

    // Corner handle gestures for more explicit resizing
    const minSize = 40;

    // Circle overlay when explicitly requested or when aspect is 1:1
    const shouldUseCircle = isCircle || (!!aspect && aspect.length === 2 && aspect[0] === aspect[1]);

    const tlPan = Gesture.Pan()
        .onBegin(() => { startX.value = rectX.value; startY.value = rectY.value; startW.value = rectW.value; startH.value = rectH.value; })
        .onChange((e) => {
            const rEdge = startX.value + startW.value;
            const bEdge = startY.value + startH.value;
            let newW = startW.value - e.translationX;
            if (desiredAspect) {
                let w = Math.max(minSize, Math.min(newW, frameWidth));
                let h = w / desiredAspect;
                rectW.value = w; rectH.value = h;
                rectX.value = rEdge - w; rectY.value = bEdge - h;
            } else {
                let newH = startH.value - e.translationY;
                rectW.value = Math.max(minSize, Math.min(newW, frameWidth));
                rectH.value = Math.max(minSize, Math.min(newH, frameHeight));
                rectX.value = rEdge - rectW.value; rectY.value = bEdge - rectH.value;
            }
            clampRect();
        });

    const trPan = Gesture.Pan()
        .onBegin(() => { startX.value = rectX.value; startY.value = rectY.value; startW.value = rectW.value; startH.value = rectH.value; })
        .onChange((e) => {
            const lEdge = startX.value;
            const bEdge = startY.value + startH.value;
            let newW = startW.value + e.translationX;
            if (desiredAspect) {
                let w = Math.max(minSize, Math.min(newW, frameWidth));
                let h = w / desiredAspect;
                rectW.value = w; rectH.value = h;
                rectX.value = lEdge; rectY.value = bEdge - h;
            } else {
                let newH = startH.value - e.translationY;
                rectW.value = Math.max(minSize, Math.min(newW, frameWidth));
                rectH.value = Math.max(minSize, Math.min(newH, frameHeight));
                rectX.value = lEdge; rectY.value = bEdge - rectH.value;
            }
            clampRect();
        });

    const blPan = Gesture.Pan()
        .onBegin(() => { startX.value = rectX.value; startY.value = rectY.value; startW.value = rectW.value; startH.value = rectH.value; })
        .onChange((e) => {
            const rEdge = startX.value + startW.value;
            const tEdge = startY.value;
            let newW = startW.value - e.translationX;
            if (desiredAspect) {
                let w = Math.max(minSize, Math.min(newW, frameWidth));
                let h = w / desiredAspect;
                rectW.value = w; rectH.value = h;
                rectX.value = rEdge - w; rectY.value = tEdge;
            } else {
                let newH = startH.value + e.translationY;
                rectW.value = Math.max(minSize, Math.min(newW, frameWidth));
                rectH.value = Math.max(minSize, Math.min(newH, frameHeight));
                rectX.value = rEdge - rectW.value; rectY.value = tEdge;
            }
            clampRect();
        });

    const brPan = Gesture.Pan()
        .onBegin(() => { startX.value = rectX.value; startY.value = rectY.value; startW.value = rectW.value; startH.value = rectH.value; })
        .onChange((e) => {
            const lEdge = startX.value;
            const tEdge = startY.value;
            let newW = startW.value + e.translationX;
            if (desiredAspect) {
                let w = Math.max(minSize, Math.min(newW, frameWidth));
                let h = w / desiredAspect;
                rectW.value = w; rectH.value = h;
                rectX.value = lEdge; rectY.value = tEdge;
            } else {
                let newH = startH.value + e.translationY;
                rectW.value = Math.max(minSize, Math.min(newW, frameWidth));
                rectH.value = Math.max(minSize, Math.min(newH, frameHeight));
                rectX.value = lEdge; rectY.value = tEdge;
            }
            clampRect();
        });

    const rectGesture = dragRect.requireExternalGestureToFail(tlPan, trPan, blPan, brPan);

    const rectStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: rectY.value,
        left: rectX.value,
        width: rectW.value,
        height: rectH.value,
        borderRadius: shouldUseCircle ? 500 : 6,
    }));

    const overlayTopStyle = useAnimatedStyle(() => ({ position: 'absolute', left: 0, right: 0, top: 0, height: frameY.value + rectY.value, backgroundColor: 'rgba(0,0,0,0.55)' }));
    const overlayBottomStyle = useAnimatedStyle(() => ({ position: 'absolute', left: 0, right: 0, top: frameY.value + rectY.value + rectH.value, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' }));
    const overlayLeftStyle = useAnimatedStyle(() => ({ position: 'absolute', top: frameY.value, height: frameH.value, left: 0, width: frameX.value + rectX.value, backgroundColor: 'rgba(0,0,0,0.55)' }));
    const overlayRightStyle = useAnimatedStyle(() => ({ position: 'absolute', top: frameY.value, height: frameH.value, left: frameX.value + rectX.value + rectW.value, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' }));

    const requestPermissions = async () => {
        const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toast({
                title: 'Permission Required',
                description: 'Sorry, we need camera roll permissions to make this work!',
                variant: 'error',
            });
            return false;
        }
        return true;
    };

    const ensureLocalFileUri = async (sourceUri: string): Promise<string> => {
        try {
            if (sourceUri.startsWith('file://')) return sourceUri;
            if (/^https?:\/\//i.test(sourceUri)) {
                console.log("Download Image")
                const noQuery = sourceUri.split('?')[0];
                const ext = noQuery.split('.').pop() || 'jpg';
                const dest = `${(FileSystem as any).cacheDirectory}avatar-crop-source.${ext}`;
                const { uri: localUri } = await FileSystem.downloadAsync(sourceUri, dest);
                return localUri;
            }
            if (sourceUri.startsWith('data:image/')) {
                const match = sourceUri.match(/^data:image\/(\w+);base64,(.+)$/);
                const ext = match?.[1] || 'jpg';
                const base64 = match?.[2];
                if (base64) {
                    const dest = `${(FileSystem as any).cacheDirectory}avatar-crop-source.${ext}`;
                    await FileSystem.writeAsStringAsync(dest, base64, { encoding: (FileSystem as any).EncodingType.Base64 });
                    return dest;
                }
            }
            return sourceUri;
        } catch (e) {
            return sourceUri;
        }
    };

    const doCrop = async () => {
        if (isCropping) return;
        setIsCropping(true);
        try {
            const hasPermission = await requestPermissions();
            if (!hasPermission) {
                return;
            }
            if (!frameSize || !originalSize) return;
            const { dx, dy, dispW, dispH, scale } = displayRef.current;
            const rx = rectX.value, ry = rectY.value, rw = rectW.value, rh = rectH.value;
            // Intersect rect with displayed image area
            const ix = Math.max(rx, dx);
            const iy = Math.max(ry, dy);
            const ix2 = Math.min(rx + rw, dx + dispW);
            const iy2 = Math.min(ry + rh, dy + dispH);
            const iW = Math.max(0, ix2 - ix);
            const iH = Math.max(0, iy2 - iy);
            if (iW < 1 || iH < 1) { onCancel(); return; }
            let originX = (ix - dx) / scale;
            let originY = (iy - dy) / scale;
            let cropW = iW / scale;
            let cropH = iH / scale;
            originX = Math.max(0, Math.min(originX, originalSize.width - 1));
            originY = Math.max(0, Math.min(originY, originalSize.height - 1));
            cropW = Math.min(cropW, originalSize.width - originX);
            cropH = Math.min(cropH, originalSize.height - originY);

            const inputUri = await ensureLocalFileUri(uri);

            console.log("Croping URL", inputUri)
            const result = await ImageManipulator.manipulateAsync(
                inputUri,
                [{ crop: { originX: Math.round(originX), originY: Math.round(originY), width: Math.round(cropW), height: Math.round(cropH) } }],
                { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
            );
            onDone(result.uri);
        } catch (err) {
            console.error('Crop failed', err);
            onCancel();
        } finally {
            setTimeout(() => {
                setIsCropping(false);
            }, 2000);
        }
    };

    const getImageDimensions = async (imageUri: string): Promise<{ width: number; height: number; aspectRatio: number }> => {
        return new Promise((resolve, reject) => {
            Image.getSize(
                imageUri,
                (width, height) => {
                    const round2 = (n: number) => Math.round(n * 100) / 100;
                    const roundedWidth = round2(width);
                    const roundedHeight = round2(height);
                    const aspectRatio = roundedWidth / roundedHeight;
                    resolve({ width: roundedWidth, height: roundedHeight, aspectRatio: round2(aspectRatio) });
                },
                (error) => {
                    console.error('Error getting image dimensions:', error);
                    reject(error);
                }
            );
        });
    };

    const calculateOptimalDimensions = async (imageUri: string) => {
        const imageDimensions = await getImageDimensions(imageUri);
        const { aspectRatio } = imageDimensions;
        const maxWidth = screenWidth - 40; // Account for padding
        const maxHeight = screenHeight - 100; // Account for modal padding and header

        let optimalWidth = maxWidth;
        let optimalHeight = maxWidth / aspectRatio;

        // If height exceeds max height, scale down based on height
        if (optimalHeight > maxHeight) {
            optimalHeight = maxHeight;
            optimalWidth = maxHeight * aspectRatio;
        }
        const round2 = (n: number) => Math.round(n * 100) / 100;
        return { width: round2(optimalWidth), height: round2(optimalHeight) };
    };

    useEffect(() => {
        let isMounted = true;
        calculateOptimalDimensions(uri)
            .then((size) => { if (isMounted) setOptimalViewSize(size); })
            .catch(() => { /* no-op */ });
        return () => { isMounted = false; };
    }, [uri, screenWidth, screenHeight]);

    return (
        <SafeAreaView className='flex-1'>
            <View className="flex-1 gap-4 items-center justify-between">
                <View className='flex-1 items-center justify-center'>
                    <View className="items-center justify-center relative" style={optimalViewSize || undefined}>
                        <View style={{ width: '100%', height: '100%' }} onLayout={onFrameLayout}>
                            {/* Full image (contain) */}
                            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                            {/* Movable/resizable crop rect */}
                            <GestureDetector gesture={rectGesture}>
                                <Animated.View style={[rectStyle]}>
                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', borderRadius: shouldUseCircle ? 500 : 6 }} />
                                    <View pointerEvents="none" style={{ flex: 1 }}>
                                        <View style={{ position: 'absolute', top: '33.333%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                                        <View style={{ position: 'absolute', top: '66.666%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                                        <View style={{ position: 'absolute', left: '33.333%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                                        <View style={{ position: 'absolute', left: '66.666%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                                        <View style={{ position: 'absolute', top: 4, left: 4, width: 22, height: 22, borderTopWidth: 3, borderLeftWidth: 3, borderColor: 'white' }} />
                                        <View style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderTopWidth: 3, borderRightWidth: 3, borderColor: 'white' }} />
                                        <View style={{ position: 'absolute', bottom: 4, left: 4, width: 22, height: 22, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: 'white' }} />
                                        <View style={{ position: 'absolute', bottom: 4, right: 4, width: 22, height: 22, borderBottomWidth: 3, borderRightWidth: 3, borderColor: 'white' }} />
                                    </View>
                                    {/* Corner handles */}
                                    <GestureDetector gesture={tlPan}><View style={{ position: 'absolute', top: -14, left: -14, width: 28, height: 28 }} /></GestureDetector>
                                    <GestureDetector gesture={trPan}><View style={{ position: 'absolute', top: -14, right: -14, width: 28, height: 28 }} /></GestureDetector>
                                    <GestureDetector gesture={blPan}><View style={{ position: 'absolute', bottom: -14, left: -14, width: 28, height: 28 }} /></GestureDetector>
                                    <GestureDetector gesture={brPan}><View style={{ position: 'absolute', bottom: -14, right: -14, width: 28, height: 28 }} /></GestureDetector>
                                </Animated.View>
                            </GestureDetector>
                        </View>

                        {/* Dimming outside rect */}
                        <Animated.View pointerEvents="none" style={overlayTopStyle} />
                        <Animated.View pointerEvents="none" style={overlayBottomStyle} />
                        <Animated.View pointerEvents="none" style={overlayLeftStyle} />
                        <Animated.View pointerEvents="none" style={overlayRightStyle} />
                    </View>
                </View>
                <View className="px-4 pb-8 flex-row items-center justify-center gap-2">
                    <Button variant="outline" className='w-20' onPress={onCancel}>
                        <Text>Cancel</Text>
                    </Button>
                    <Button variant="outline" className='w-20' onPress={doCrop} disabled={isCropping}>
                        {isCropping ? <ActivityIndicator size="small" /> : <Text>Crop</Text>}
                    </Button>
                </View>
            </View>
        </SafeAreaView>
    );
}
