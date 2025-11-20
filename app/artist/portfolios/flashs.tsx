import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import Header from "@/components/lib/Header";
import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import { View, Image, Pressable, ActivityIndicator, Dimensions, Keyboard, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Icon } from "@/components/ui/icon";
import { DollarSign, Plus, Save } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/contexts/toast-context";
import { useEffect, useMemo, useState } from "react";
import { THEME } from "@/lib/theme";
import { ArtistFlash, CreateFlashData, UpdateFlashData } from "@/lib/types";
import { useAuth } from "@/lib/contexts";
import { createFlash, deleteFlash, getArtistFlashs, updateFlash, upsertFlashes } from "@/lib/services/flash-service";
import * as ExpoImagePicker from 'expo-image-picker';
import { uploadFileToStorage } from "@/lib/services/storage-service";
import { compressImage } from "@/lib/utils";

interface MediaChunk {
    id?: string;
    artist_id?: string;
    flash_name?: string;
    flash_image?: string;
    flash_price?: number;
    repeatable?: boolean;
    created_at?: string;
    updated_at?: string;
    chunk_type: string; // 'flash' | 'uploading'
    progress?: number;
    status?: 'uploading' | 'completed' | 'error';
}

const { width } = Dimensions.get('window');

export default function UploadFlashs() {
    const { toast } = useToast();
    const { artist } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [originalFlashs, setOriginalFlashs] = useState<ArtistFlash[]>([]);
    const [flashs, setFlashs] = useState<ArtistFlash[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingFlashId, setDeletingFlashId] = useState<string | null>(null);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);
    const [uploadingImages, setUploadingImages] = useState<{ id: string, progress: number, status: 'uploading' | 'completed' | 'error', imageUri: string }[]>([]);
    const [priceInputs, setPriceInputs] = useState<{ [key: string]: string }>({});
    const [watermarkDimensions, setWatermarkDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    useEffect(() => {
        loadFlashs();
        loadWatermarkDimensions();
    }, []);

    const loadWatermarkDimensions = async () => {
        if (!artist?.app?.watermark_image) return;

        try {
            const dimensions = await getImageDimensions(artist.app.watermark_image);
            setWatermarkDimensions(dimensions);
        } catch (error) {
            console.error('Error getting watermark dimensions:', error);
        }
    };

    const loadFlashs = async () => {
        if (!artist?.id) return;

        setLoading(true);
        try {
            const result = await getArtistFlashs(artist.id);
            if (result.success && result.data) {
                setFlashs(result.data);
                setOriginalFlashs(result.data);
            } else {
                toast({
                    variant: 'error',
                    title: 'Error loading flashs',
                    description: result.error || 'Failed to load flashs',
                });
            }
        } catch (error) {
            console.error('Error loading flashs:', error);
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Failed to load flashs',
            });
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = useMemo(() => {
        const isSame = JSON.stringify(flashs) === JSON.stringify(originalFlashs);
        return !isSame;
    }, [flashs, originalFlashs]);

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    };

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    const handleSaveFlash = async () => {
        // Only save flashes that have names; skip unnamed ones
        const namedFlashes = flashs.filter(f => (f.flash_name || '').trim() !== '' || (f.flash_price || 0) > 0);
        if (namedFlashes.length === 0) {
            toast({
                variant: 'error',
                title: 'Nothing to Save',
                description: 'No named flashes to save yet.',
            });
            return;
        }
        setSaving(true);
        Keyboard.dismiss();
        try {
            if (!artist?.id) {
                toast({
                    variant: 'error',
                    title: 'Missing Artist',
                    description: 'Cannot save without an artist id.',
                });
                return;
            }

            const updatesById = namedFlashes.map(f => ({
                id: f.id as string,
                flash_name: f.flash_name,
                flash_price: f.flash_price || 0,
                repeatable: f.repeatable,
                flash_image: f.flash_image,
            }));

            const upsertResult = await upsertFlashes(artist.id, updatesById);

            if (!upsertResult.success) {
                toast({
                    variant: 'error',
                    title: 'Save Failed',
                    description: upsertResult.error || 'Failed to save flashes.',
                });
                return;
            }

            toast({
                variant: 'success',
                title: 'Flashes Updated',
                description: `${namedFlashes.length} flash${namedFlashes.length === 1 ? '' : 'es'} saved successfully.`,
            });
            setOriginalFlashs(flashs);
        } catch (error) {
            console.error('Error saving flashes:', error);
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Failed to save flashes. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleFlashDeleteConfirm = async () => {
        if (!deletingFlashId) return;

        setDeleting(true);

        try {
            // Delete from database first
            const deleteResult = await deleteFlash(deletingFlashId);

            if (deleteResult.success) {
                // Remove flash from state
                setFlashs(prevFlashs => prevFlashs.filter(f => f.id !== deletingFlashId));

                setOriginalFlashs(prevOriginal => prevOriginal.filter(f => f.id !== deletingFlashId));

                toast({
                    variant: 'success',
                    title: 'Flash Deleted!',
                    description: 'You can always upload a new flash if needed.',
                });
            } else {
                toast({
                    variant: 'error',
                    title: 'Delete Failed',
                    description: deleteResult.error || 'Failed to delete flash',
                });
            }
        } catch (error) {
            console.error('Error deleting flash:', error);
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Failed to delete flash',
            });
        } finally {
            setIsDeleteModalOpen(false);
            setDeletingFlashId(null);
            setDeleting(false);
        }
    };

    const handleAddNewFlash = async () => {
        try {
            const result = await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
            });

            if (!result.canceled && result.assets.length > 0) {

                // Initialize upload progress for each image
                const initialUploadStates = result.assets.map((asset, index) => ({
                    id: `upload_${Date.now()}_${index}`,
                    progress: 0,
                    status: 'uploading' as const,
                    imageUri: asset.uri
                }));
                setUploadingImages(initialUploadStates);

                // Process each image: compress, upload to Supabase, and save to database
                const savedFlashs = await Promise.all(result.assets.map(async (asset, index) => {
                    const uploadId = initialUploadStates[index].id;

                    try {
                        // Update progress: Starting compression
                        setUploadingImages(prev => prev.map(img =>
                            img.id === uploadId ? { ...img, progress: 10 } : img
                        ));

                        // Compress the image first
                        const compressedImage = await compressImage(asset.uri, 0.6);

                        // Update progress: Compression done, starting upload
                        setUploadingImages(prev => prev.map(img =>
                            img.id === uploadId ? { ...img, progress: 30 } : img
                        ));

                        // Upload to Supabase storage
                        const fileUpload = {
                            uri: compressedImage,
                            name: `flash_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`,
                            type: 'image/jpeg',
                            size: 0 // Will be calculated by storage service
                        };

                        const uploadResult = await uploadFileToStorage(fileUpload, 'artist-flashs', artist?.id);

                        if (!uploadResult.success || !uploadResult.url) {
                            throw new Error(uploadResult.error || 'Failed to upload image');
                        }

                        // Update progress: Upload done, starting database save
                        setUploadingImages(prev => prev.map(img =>
                            img.id === uploadId ? { ...img, progress: 80 } : img
                        ));

                        // Create flash data and save to database
                        const flashData: CreateFlashData = {
                            flash_name: '', // Default empty name, user can edit later
                            flash_image: uploadResult.url,
                            flash_price: 0, // Default price, user can edit later
                            repeatable: false // Default repeatable setting
                        };

                        const createResult = await createFlash(artist?.id as string, flashData);

                        if (!createResult.success || !createResult.data) {
                            throw new Error(createResult.error || 'Failed to create flash');
                        }

                        // Update progress: Completed
                        setUploadingImages(prev => prev.map(img =>
                            img.id === uploadId ? { ...img, progress: 100, status: 'completed' } : img
                        ));

                        return createResult.data;
                    } catch (error) {
                        console.error('Error processing image:', error);
                        // Update progress: Error
                        setUploadingImages(prev => prev.map(img =>
                            img.id === uploadId ? { ...img, status: 'error' } : img
                        ));
                        throw error;
                    }
                }));

                setUploadingImages([]);
                setFlashs(prev => [...prev, ...savedFlashs]);
                setOriginalFlashs(prev => [...prev, ...savedFlashs]);

                toast({
                    title: 'Success',
                    description: `${savedFlashs.length} flash image(s) uploaded and saved successfully!`,
                    variant: 'success',
                });
            }
        } catch (error) {
            console.error('Error picking/uploading/saving images:', error);
            toast({
                title: 'Error',
                description: 'Failed to upload and save images. Please try again.',
            });
            // Clear upload states on error
            setUploadingImages([]);
        }
    };

    const mediaChunks = useMemo(() => {
        // Create chunks for regular flashs
        const flashChunks: MediaChunk[] = [...flashs.map(flash => ({ ...flash, chunk_type: 'flash' }))];

        // Create chunks for uploading images
        const uploadingChunks: MediaChunk[] = [...uploadingImages.map(upload => ({
            id: upload.id,
            flash_image: upload.imageUri,
            chunk_type: 'uploading',
            progress: upload.progress,
            status: upload.status
        }))];

        const chunks: MediaChunk[] = [...flashChunks, ...uploadingChunks];

        // Chunk into arrays of 2 items
        const chunkSize = 2;
        const chunked: MediaChunk[][] = [];
        for (let i = 0; i < chunks.length; i += chunkSize) {
            chunked.push(chunks.slice(i, i + chunkSize));
        }

        return chunked;
    }, [loading, flashs, uploadingImages]);

    const handleDeleteFlash = (flashId: string) => {
        if (flashId && flashId.trim() !== '') {
            Keyboard.dismiss();
            setDeletingFlashId(flashId);
            setIsDeleteModalOpen(true);
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

    const calculateOptimalDimensions = (imageDimensions: { width: number; height: number; aspectRatio: number }) => {
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

    const getWatermarkPosition = (position: string, containerWidth: number, containerHeight: number, watermarkWidth?: number, watermarkHeight?: number) => {
        const margin = 0;

        switch (position) {
            case 'top-left':
                return { top: margin, left: margin };
            case 'top-right':
                return { top: margin, right: margin };
            case 'bottom-left':
                return { bottom: margin, left: margin };
            case 'bottom-right':
                return { bottom: margin, right: margin };
            case 'center':
            default:
                if (watermarkWidth && watermarkHeight) {
                    return {
                        top: containerHeight / 2 - watermarkHeight / 2,
                        left: containerWidth / 2 - watermarkWidth / 2
                    };
                } else {
                    // For text watermarks, center them without specific dimensions
                    return {
                        top: containerHeight / 2,
                        left: containerWidth / 2,
                        transform: [{ translateX: -50 }, { translateY: -50 }]
                    };
                }
        }
    };

    const calculateWatermarkSize = (maxSize: number = 100) => {
        if (!watermarkDimensions) {
            return { width: maxSize, height: maxSize };
        }

        const { aspectRatio } = watermarkDimensions;
        let width = maxSize;
        let height = maxSize / aspectRatio;

        // If height exceeds max size, scale down based on height
        if (height > maxSize) {
            height = maxSize;
            width = maxSize * aspectRatio;
        }

        return { width, height };
    };

    const renderWatermark = (containerWidth: number, containerHeight: number, maxSize: number = 150) => {
        if (!artist?.app?.watermark_enabled) return null;

        const settings = artist?.app;
        const opacity = (settings.watermark_opacity || 50) / 100;

        return (
            <View className="absolute z-10 top-0 left-0 w-full h-full">
                {settings.watermark_image && (
                    <Image
                        source={{ uri: settings.watermark_image }}
                        style={[
                            {
                                width: calculateWatermarkSize(maxSize).width,
                                height: calculateWatermarkSize(maxSize).height,
                                position: 'absolute',
                                opacity: opacity
                            },
                            getWatermarkPosition(
                                settings.watermark_position || 'center',
                                containerWidth,
                                containerHeight,
                                calculateWatermarkSize(maxSize).width,
                                calculateWatermarkSize(maxSize).height
                            )
                        ]}
                        resizeMode="contain"
                    />
                )}
                {settings.watermark_text && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: containerWidth,
                            height: containerHeight,
                            opacity: opacity,
                        }}
                    >
                        {/* Create diagonal repeating pattern */}
                        {Array.from({ length: Math.ceil(containerWidth / 150) * Math.ceil(containerHeight / 150) }, (_, index) => {
                            const row = Math.floor(index / Math.ceil(containerWidth / 150));
                            const col = index % Math.ceil(containerWidth / 150);
                            const x = col * 150;
                            const y = row * 150;

                            return (
                                <View
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        left: x,
                                        top: y,
                                        transform: [{ rotate: '-45deg' }],
                                    }}
                                >
                                    <Text
                                        className="text-white text-lg font-bold"
                                        style={{
                                            textShadowColor: 'rgba(0, 0, 0, 0.8)',
                                            textShadowOffset: { width: 1, height: 1 },
                                            textShadowRadius: 2,
                                            letterSpacing: 2,
                                            opacity: 0.3,
                                        }}
                                    >
                                        {settings.watermark_text}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    const handleImagePress = async (imageSource: any) => {
        Keyboard.dismiss();
        console.log('Opening image viewer for:', imageSource);

        try {
            // Convert URI string to proper format for Image component
            const imageToShow = typeof imageSource === 'string' ? { uri: imageSource } : imageSource;
            setSelectedImageSource(imageToShow);

            // Get image dimensions
            const imageUri = typeof imageSource === 'string' ? imageSource : imageSource.uri;
            const dimensions = await getImageDimensions(imageUri);

            console.log('dimensions', dimensions);
            setImageDimensions(dimensions);

            setIsImageViewerVisible(true);
        } catch (error) {
            console.error('Error getting image dimensions:', error);
            // Fallback to showing image without dimension optimization
            const imageToShow = typeof imageSource === 'string' ? { uri: imageSource } : imageSource;
            setSelectedImageSource(imageToShow);
            setImageDimensions(null);
            setIsImageViewerVisible(true);
        }
    };

    const handleCloseImageViewer = () => {
        setIsImageViewerVisible(false);
        setSelectedImageSource(null);
        setImageDimensions(null);
    };

    return (
        <View style={{ width }} className="flex-1">
            <KeyboardAwareScrollView
                contentContainerClassName="w-full"
                showsVerticalScrollIndicator={false}
                bottomOffset={80}
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                    <View className="items-center justify-center" style={{ height: 180 }}>
                        <Image
                            source={require('@/assets/images/icons/flash.png')}
                            style={{ width: 56, height: 56 }}
                            resizeMode="contain"
                        />
                        <Text variant="h6" className="text-center uppercase">Flash</Text>
                        <Text variant="h6" className="text-center uppercase leading-none">upload</Text>
                        <Text className="text-center mt-2 text-text-secondary max-w-80">Add your ready-to-go designs below. Give them a name, price, and mark if they’re repeatable.</Text>
                    </View>
                    {mediaChunks.length === 0 && !loading && (
                        <View className="flex-1 items-center justify-center py-8">
                            <Text variant="h6" className="text-center text-text-secondary">No Flash Yet</Text>
                        </View>
                    )}

                    {loading ? (
                        <View className="flex-1 items-center justify-center py-8">
                            <ActivityIndicator size="large" color={THEME.dark.primary} />
                            <Text className="text-text-secondary mt-4">Loading flashs...</Text>
                        </View>
                    ) : (
                        <View className="gap-4">
                            {mediaChunks.map((chunk, index) => {
                                const itemsToRender: MediaChunk[] =
                                    chunk.length === 1
                                        ? [...chunk, { chunk_type: 'placeholder' } as MediaChunk]
                                        : chunk;
                                return (
                                    <View key={index} className="flex-row gap-4">
                                        {itemsToRender.map((item, itemIndex) => {
                                            if (item.chunk_type === 'placeholder') {
                                                return <View key={`placeholder-${itemIndex}`} className="flex-1" />;
                                            }
                                            if (item.chunk_type === 'uploading') {
                                                return (
                                                    <View key={itemIndex} className="flex-1 gap-1">
                                                        <View className="relative">
                                                            <Image
                                                                source={{ uri: item.flash_image }}
                                                                style={{ width: '100%', height: 216, borderRadius: 8 }}
                                                                resizeMode="cover"
                                                            />
                                                            {/* Progress Overlay */}
                                                            <View className="absolute inset-0 bg-black/50 rounded-lg justify-center items-center">
                                                                {item.status === 'uploading' && (
                                                                    <>
                                                                        <ActivityIndicator size="large" color="white" />
                                                                    </>
                                                                )}
                                                                {item.status === 'completed' && (
                                                                    <>
                                                                        <Image
                                                                            source={require('@/assets/images/icons/check_circle.png')}
                                                                            style={{ width: 32, height: 32 }}
                                                                            resizeMode="contain"
                                                                        />
                                                                        <Text className="text-white text-sm mt-2">Completed!</Text>
                                                                    </>
                                                                )}
                                                                {item.status === 'error' && (
                                                                    <>
                                                                        <Image
                                                                            source={require('@/assets/images/icons/x_circle.png')}
                                                                            style={{ width: 32, height: 32 }}
                                                                            resizeMode="contain"
                                                                        />
                                                                        <Text className="text-white text-sm mt-2">Error</Text>
                                                                    </>
                                                                )}
                                                            </View>
                                                        </View>
                                                        <Text className="text-xs text-text-secondary">Uploading...</Text>
                                                    </View>
                                                );
                                            }

                                            return (
                                                <View key={itemIndex} className="flex-1 gap-1">
                                                    <Pressable
                                                        onPress={() => handleImagePress(item.flash_image)}
                                                        style={{ borderRadius: 8, overflow: 'hidden', height: 216, width: '100%' }}
                                                        className="relative"
                                                    >
                                                        <Image
                                                            source={item.flash_image ? { uri: item.flash_image } : require('@/assets/images/icons/flash.png')}
                                                            style={{ width: "100%", height: "100%" }}
                                                            resizeMode="cover"
                                                        />
                                                        {renderWatermark(((screenWidth - 32 - 16) / 2), 216, 50)}
                                                    </Pressable>
                                                    <Input
                                                        placeholder="Title"
                                                        className="border-0 h-6 p-0 text-md"
                                                        value={item.flash_name || ''}
                                                        onChangeText={(text) => {
                                                            // Update flash name in the flashs array immediately for UI
                                                            setFlashs(flashs.map(flash =>
                                                                flash.id === item.id ? { ...flash, flash_name: text } : flash
                                                            ));
                                                        }}
                                                    />
                                                    <Input
                                                        placeholder="Price (Optional)"
                                                        className="border-0 h-6 py-0 pl-4 text-md"
                                                        leftIcon={DollarSign}
                                                        leftIconClassName="left-0"
                                                        value={priceInputs[item.id as string] ?? (item.flash_price?.toString() || '')}
                                                        onChangeText={(text) => {
                                                            // Update the input state
                                                            setPriceInputs(prev => ({
                                                                ...prev,
                                                                [item.id as string]: text
                                                            }));

                                                            // Update flash price only if it's a valid number
                                                            const price = text.trim() === '' ? 0 : parseFloat(text);
                                                            if (!isNaN(price)) {
                                                                setFlashs(flashs.map(flash =>
                                                                    flash.id === item.id ? { ...flash, flash_price: price } : flash
                                                                ));
                                                            }
                                                        }}
                                                    />
                                                    <View className="flex-row items-center justify-between">
                                                        <Text className="text-text-secondary">Repeatable?</Text>
                                                        <Switch
                                                            checked={item.repeatable || false}
                                                            onCheckedChange={async () => {
                                                                const newRepeatable = !item.repeatable;
                                                                // Update repeatable setting in the flashs array immediately for UI
                                                                setFlashs(flashs.map(flash =>
                                                                    flash.id === item.id ? { ...flash, repeatable: newRepeatable } : flash
                                                                ));
                                                                setOriginalFlashs(prevOriginalFlashs => prevOriginalFlashs.map(f => f.id === item.id ? { ...f, repeatable: newRepeatable } : f));

                                                                // Update in Supabase immediately
                                                                try {
                                                                    const updateResult = await updateFlash(item.id as string, { repeatable: newRepeatable });
                                                                    if (!updateResult.success) {
                                                                        toast({
                                                                            variant: 'error',
                                                                            title: 'Update Failed',
                                                                            description: updateResult.error || 'Failed to update repeatable setting',
                                                                        });
                                                                        // Revert the UI change if update failed
                                                                        setFlashs(flashs.map(flash =>
                                                                            flash.id === item.id ? { ...flash, repeatable: !newRepeatable } : flash
                                                                        ));
                                                                    } else {
                                                                        toast({
                                                                            variant: 'success',
                                                                            title: 'Updated',
                                                                            description: 'Repeatable setting updated successfully.',
                                                                        });
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error updating repeatable:', error);
                                                                    toast({
                                                                        variant: 'error',
                                                                        title: 'Error',
                                                                        description: 'Failed to update repeatable setting. Please try again.',
                                                                    });
                                                                    // Revert the UI change if update failed
                                                                    setFlashs(flashs.map(flash =>
                                                                        flash.id === item.id ? { ...flash, repeatable: !newRepeatable } : flash
                                                                    ));
                                                                }
                                                            }}
                                                        />
                                                    </View>
                                                    <View className="flex-row items-center gap-2 mt-1">
                                                        <Pressable className="flex-row gap-1 p-1" onPress={() => handleDeleteFlash(item.id as string || '')}>
                                                            <Image
                                                                source={require('@/assets/images/icons/trash.png')}
                                                                style={{ width: 20, height: 20 }}
                                                            />
                                                            <Text className="text-text-secondary">Delete</Text>
                                                        </Pressable>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </KeyboardAwareScrollView>

            <View className="gap-4 px-4 py-4">
                {hasChanges ? (
                    <Button variant="outline" onPress={handleSaveFlash} disabled={saving}>
                        {saving ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text>Save Changes</Text>
                        )}
                    </Button>
                ) : (
                    <Button variant="outline" onPress={handleAddNewFlash}>
                        <Text>Upload New Flash</Text>
                        <Icon as={Plus} size={24} strokeWidth={1} />
                    </Button>
                )}
            </View>

            <Modal
                visible={isDeleteModalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIsDeleteModalOpen(false)}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <Pressable style={{ flex: 1 }} onPress={() => setIsDeleteModalOpen(false)} />
                    <View className="bg-background-secondary" style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40 }}>
                        <View className="w-full px-4 pb-4 pt-6 gap-6">
                            <View className="gap-6 items-center">
                                <Image source={require('@/assets/images/icons/warning_circle.png')} style={{ width: 80, height: 80 }} />
                                <Text variant="h3" className="text-center">Delete Flash</Text>
                                <Text className="text-text-secondary text-center text-sm leading-5">Are you sure? This action can't be undone.</Text>

                                <View className="gap-2 flex-row w-full">
                                    <View className="flex-1">
                                        <Button onPress={() => setIsDeleteModalOpen(false)} variant="outline" size='lg' className='items-center justify-center'>
                                            <Text>Cancel</Text>
                                        </Button>
                                    </View>
                                    <View className="flex-1">
                                        <Button disabled={deleting} onPress={handleFlashDeleteConfirm} size='lg' className='items-center justify-center'>
                                            <Text>Delete</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={isImageViewerVisible}
                transparent
                animationType="fade"
                onRequestClose={handleCloseImageViewer}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}
                    onPress={handleCloseImageViewer}
                >
                    {imageDimensions && (
                        <View className="overflow-hidden relative" style={calculateOptimalDimensions(imageDimensions)}>
                            <Image
                                source={selectedImageSource}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="contain"
                            />
                            {renderWatermark(calculateOptimalDimensions(imageDimensions).width, calculateOptimalDimensions(imageDimensions).height)}
                        </View>
                    )}
                </Pressable>
            </Modal>
        </View>
    );
}