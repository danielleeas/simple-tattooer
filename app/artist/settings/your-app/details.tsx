import { useCallback, useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Image, Modal, Dimensions, Keyboard } from "react-native";
import * as Clipboard from 'expo-clipboard';
import { ChevronDown, X } from "lucide-react-native";
import { Pressable } from "react-native";
import * as ExpoImagePicker from 'expo-image-picker';

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AvatarPicker } from "@/components/lib/avatar-picker";
import { Collapse } from "@/components/lib/collapse";
import { BASE_URL } from "@/lib/constants";
import { LocationModal, LocationData } from '@/components/lib/location-modal';
import { BrandingDataProps, opacityOptions, placementOptions } from "./type";
import { compressImage, uuidv4 } from "@/lib/utils";
import { checkBookingLinkAvailability } from "@/lib/services/auth-service";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/lib/contexts";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import CustomModal from "@/components/lib/custom-modal";

interface DetailsProps {
    brandingData: BrandingDataProps;
    updateBrandingData: (updates: Partial<BrandingDataProps>) => void;
    artist: any;
}

export const Details = ({ brandingData, updateBrandingData, artist }: DetailsProps) => {
    const { toast } = useToast();
    const [hasError, setHasError] = useState(false);
    const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
    const [optionOpen, setOptionOpen] = useState(false);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const [watermarkDimensions, setWatermarkDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    const copyBookingLink = async (bookingLink: string) => {
        await Clipboard.setStringAsync(bookingLink);
    }

    const bookingLinkSuffix = (bookingLink: string) => {
        return bookingLink.split('/').slice(-1)[0] || '';
    }

    const checkUniqueBookingLink = async (bookingLinkSuffix: string) => {
        if (!bookingLinkSuffix.trim()) {
            setHasError(false);
            return;
        }

        setHasError(false);

        try {
            const result = await checkBookingLinkAvailability(bookingLinkSuffix, artist?.id);

            if (!result.isAvailable) {
                setHasError(true);
            }
        } catch (error) {
            console.error('Error checking booking link:', error);
            setHasError(true);
        }
    };

    const debouncedCheckBookingLink = useCallback((bookingLinkSuffix: string) => {
        // Clear existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout
        debounceTimeoutRef.current = setTimeout(() => {
            checkUniqueBookingLink(bookingLinkSuffix);
        }, 3000); // Wait 3 second after user stops typing
    }, [artist?.id]);

    const handleEditLocation = (location: LocationData) => {
        setEditingLocation(location);
        setIsLocationModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsLocationModalVisible(false);
        setEditingLocation(null);
    };

    const handleRemoveLocation = (id: string) => {
        console.log(id)
        updateBrandingData({ location: undefined });
    };

    const handleLocationSelect = (locationData: Omit<LocationData, 'id'>) => {
        if (editingLocation) {
            // Update existing location
            const updatedLocation = { ...brandingData.location, ...locationData };
            updateBrandingData({ location: updatedLocation });
        } else {
            // Add new location
            const newLocation: LocationData = {
                ...locationData,
                id: uuidv4(),
                isMainStudio: true,
            };
            updateBrandingData({ location: newLocation });
        }

        // Reset editing state
        setEditingLocation(null);
    };

    const takePhoto = async () => {
        setOptionOpen(false);
        const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            toast({
                title: 'Permission Required',
                description: 'Sorry, we need camera permissions to make this work!',
                variant: 'error',
            });
            return;
        }

        try {
            const result = await ExpoImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const selectedImage = result.assets[0].uri;
                const compressedImage = await compressImage(selectedImage);
                updateBrandingData({ watermarkImage: compressedImage });
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            toast({
                title: 'Error',
                description: 'Failed to take photo. Please try again.',
                variant: 'error',
            });
        }
    };

    const pickImage = async () => {
        setOptionOpen(false);
        const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toast({
                title: 'Permission Required',
                description: 'Sorry, we need photo library permissions to make this work!',
                variant: 'error',
            });
            return;
        }

        try {
            const result = await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const selectedImage = result.assets[0].uri;
                const compressedImage = await compressImage(selectedImage);
                updateBrandingData({ watermarkImage: compressedImage });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            toast({
                title: 'Error',
                description: 'Failed to pick image. Please try again.',
                variant: 'error',
            });
        }
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

    const handleCloseImageViewer = () => {
        setIsImageViewerVisible(false);
        setSelectedImageSource(null);
        setImageDimensions(null);
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

    const getWatermarkPosition = (position: string, containerWidth: number, containerHeight: number, watermarkWidth?: number, watermarkHeight?: number) => {
        const margin = 0;

        switch (position) {
            case 'top-left':
                return { top: 0, left: 0 };
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

    const renderWatermark = (containerWidth: number, containerHeight: number, maxSize: number = 150) => {
        const opacity = (brandingData.watermarkOpacity || 50) / 100;

        return (
            <View className="absolute z-10 top-0 left-0 w-full h-full">
                {brandingData.watermarkImage && (
                    <Image
                        source={{ uri: brandingData.watermarkImage }}
                        style={[
                            {
                                width: calculateWatermarkSize(maxSize).width,
                                height: calculateWatermarkSize(maxSize).height,
                                position: 'absolute',
                                opacity: opacity
                            },
                            getWatermarkPosition(
                                brandingData.watermarkPosition || 'center',
                                containerWidth,
                                containerHeight,
                                calculateWatermarkSize(maxSize).width,
                                calculateWatermarkSize(maxSize).height
                            )
                        ]}
                        resizeMode="contain"
                    />
                )}
                {brandingData.watermarkText && (
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
                                        {brandingData.watermarkText}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
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

    const updateWatermarkDimentions = useCallback(async () => {
        try {
            const uri = brandingData.watermarkImage;
            if (!uri) {
                setWatermarkDimensions(null);
                return;
            }
            const dims = await getImageDimensions(uri);
            setWatermarkDimensions(dims);
        } catch (error) {
            console.error('Failed to update watermark dimensions:', error);
            setWatermarkDimensions(null);
        }
    }, [brandingData.watermarkImage]);

    useEffect(() => {
        updateWatermarkDimentions();
    }, [updateWatermarkDimentions]);

    const handleWatermarkPreview = async (imageSource: any) => {
        Keyboard.dismiss();
        console.log('Opening image viewer for:', imageSource);

        try {
            await updateWatermarkDimentions();
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

    return (
        <View className="gap-6 mt-4">
            <View className="gap-2">
                <Text variant="h5">Your Name</Text>
                <Input value={brandingData.fullName} onChangeText={(text) => { updateBrandingData({ fullName: text }) }} />
            </View>
            <View className="gap-2">
                <Text variant="h5">Studio Name</Text>
                <Input value={brandingData.studioName} onChangeText={(text) => { updateBrandingData({ studioName: text }) }} />
            </View>
            <View className="gap-1">
                <View className='flex-row gap-2 items-center'>
                    <Text variant="h5" className='flex-1' style={{ maxWidth: 290 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Edit/Copy Personal Booking Link</Text>
                    <View className="relative">
                        <TouchableOpacity
                            onPress={() => copyBookingLink(brandingData.bookingLink)}
                            className="p-1 rounded"
                        >
                            <Image
                                source={require('@/assets/images/icons/copy.png')}
                                style={{ width: 32, height: 32 }}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View>
                    <Text className="leading-none">Tap to edit, use icon to copy</Text>
                </View>
                <View className={`border rounded-sm px-2 h-10 flex-row items-center overflow-hidden ${hasError ? 'border-destructive' : 'border-border-white'}`}>
                    <Text className='text-text-secondary text-base'>{BASE_URL}/</Text>
                    <Input
                        className="border-0 pl-0"
                        value={bookingLinkSuffix(brandingData.bookingLink)}
                        onChangeText={(text) => {
                            setHasError(false);
                            updateBrandingData({ bookingLink: `${BASE_URL}/${text}` })
                            debouncedCheckBookingLink(text);
                        }}
                        onEndEditing={() => {
                            checkUniqueBookingLink(bookingLinkSuffix(brandingData.bookingLink));
                        }}
                    />
                </View>
            </View>

            <Collapse title="Location (Type address or studio name)" textClassName="text-xl">
                <View className="gap-2">
                    <View className='items-center w-full'>
                        <Text className='text-center text-text-secondary w-full'>Add your main studio address.</Text>
                    </View>
                    {brandingData.location ? (
                        <View className="w-full gap-2">
                            <View className="flex-row items-center justify-between gap-2">
                                <Pressable
                                    className="flex-1 flex-row items-center justify-between px-4 h-10 border border-border-white rounded-md"
                                    onPress={() => handleEditLocation(brandingData.location!)}
                                >
                                    <View className='flex-1'>
                                        <Text className="text-white text-sm font-normal" numberOfLines={1} ellipsizeMode="tail">
                                            {brandingData.location.address}
                                        </Text>
                                    </View>
                                    <View className='min-w-6 items-end justify-center'>
                                        <ChevronDown size={20} color="white" />
                                    </View>
                                </Pressable>
                                <View className="flex-row gap-1">
                                    <Pressable onPress={() => brandingData.location?.id && handleRemoveLocation(brandingData.location.id!)} className="p-2 bg-background-secondary border border-border rounded-full">
                                        <Image
                                            source={require('@/assets/images/icons/delete.png')}
                                            style={{ width: 24, height: 24 }}
                                            resizeMode="contain"
                                        />
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <Pressable className="p-3 bg-background border border-border-white rounded-sm h-10" onPress={() => setIsLocationModalVisible(true)} />
                    )}
                    <Text className='text-text-secondary w-full leading-none'>You can set up guest spots and travel dates in your calendar</Text>
                </View>
            </Collapse>

            <Collapse title="Social Media Handle" textClassName="text-xl">
                <View className="gap-2">
                    <Input placeholder="@instagram_handle" value={brandingData.socialMediaHandle} onChangeText={(text) => { updateBrandingData({ socialMediaHandle: text }) }} />
                    <Text className='text-text-secondary leading-none'>Show clients where to find you</Text>
                </View>
            </Collapse>

            <Collapse title="Profile Photo" textClassName="text-xl">
                <View className="gap-2 items-center">
                    <View className='w-full' style={{ height: 582 }}>
                        <AvatarPicker
                            initialImage={brandingData.profilePhoto}
                            className='h-full'
                            placeholder='Choose Image'
                            aspect={[2, 3]}
                            helperText='PNG, JPG, HEIC up to 10MB'
                            allowedFileTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                            onImageSelected={(uri) => { updateBrandingData({ profilePhoto: uri }) }}
                            onImageRemoved={() => { updateBrandingData({ profilePhoto: '' }) }}
                        />
                    </View>
                    <Text className="text-center leading-none" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Add a photo for Welcome Screen</Text>
                </View>
            </Collapse>

            <Collapse title="Avatar" textClassName="text-xl">
                <View className="gap-2 items-center">
                    <View className='w-60 h-60'>
                        <AvatarPicker
                            initialImage={brandingData.avatar}
                            className='h-full'
                            placeholder='Choose Image'
                            aspect={[1, 1]}
                            helperText='PNG, JPG, HEIC up to 10MB'
                            allowedFileTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                            onImageSelected={(uri) => { updateBrandingData({ avatar: uri }) }}
                            onImageRemoved={() => { updateBrandingData({ avatar: '' }) }}
                        />
                    </View>
                    <View className="gap-1">
                        <Text className="text-center leading-none" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Edit your photo for your Personal</Text>
                        <Text className="text-center leading-none" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Booking Link & Emails</Text>
                    </View>
                </View>
            </Collapse>

            <View className="flex-row items-start gap-2">
                <Pressable className="flex-1 gap-2" onPress={() => { updateBrandingData({ watermarkEnabled: !brandingData.watermarkEnabled }) }}>
                    <Text className="text-xl leading-none">
                        Apply watermark
                    </Text>
                    <Text className="text-text-secondary text-sm leading-5">When uploading drawings or photos — uses your saved settings automatically.</Text>
                </Pressable>
                <Switch
                    checked={brandingData.watermarkEnabled}
                    onCheckedChange={(checked) => { updateBrandingData({ watermarkEnabled: checked }) }}
                />
            </View>

            {brandingData.watermarkEnabled && (
                <>
                    <View>
                        <Button variant="outline" onPress={() => handleWatermarkPreview(brandingData.profilePhoto)}>
                            <Text>Watermark Preview</Text>
                        </Button>
                    </View>

                    <View className="gap-2">
                        <View className='flex-row gap-2 items-center'>
                            <Text variant="h5">Upload watermark image</Text>
                            <View className="relative">
                                <TouchableOpacity
                                    onPress={() => setOptionOpen(true)}
                                    className="p-1 rounded"
                                >
                                    <Image
                                        source={require('@/assets/images/icons/camera.png')}
                                        style={{ width: 32, height: 32 }}
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {brandingData.watermarkImage && (
                            <View className="gap-3">
                                <View className="relative bg-background-secondary rounded-lg border border-border-white">
                                    <Image
                                        source={{ uri: brandingData.watermarkImage }}
                                        style={{ width: '100%', height: 250 }}
                                        resizeMode="contain"
                                        className="rounded-md"
                                    />
                                    <View className="absolute top-2 right-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onPress={() => updateBrandingData({ watermarkImage: '' })}
                                            className="rounded-full w-8 h-8 p-0 items-center justify-center"
                                        >
                                            <Icon as={X} size={16} />
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    <View className="gap-2">
                        <Text variant="h5">Watermark Text</Text>
                        <Input value={brandingData.watermarkText} onChangeText={(text) => updateBrandingData({ watermarkText: text })} />
                    </View>

                    <View className="gap-2">
                        <Text variant="h5">Choose Placement</Text>
                        <View className="gap-2 w-full">
                            <DropdownPicker
                                options={placementOptions.map(option => ({ label: option.label, value: option.value }))}
                                value={brandingData.watermarkPosition}
                                onValueChange={(value) => updateBrandingData({ watermarkPosition: value })}
                                placeholder="Select placement"
                                modalTitle="Select Placement"
                            />
                        </View>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5">Opacity</Text>
                        <View className="gap-2 w-full">
                            <DropdownPicker
                                options={opacityOptions.map(option => ({ label: option.label, value: option.value }))}
                                value={brandingData.watermarkOpacity?.toString()}
                                onValueChange={(value) => updateBrandingData({ watermarkOpacity: parseInt(value) })}
                                placeholder="Select opacity"
                                modalTitle="Select Opacity"
                            />
                        </View>
                    </View>
                </>
            )}

            <View className="flex-row items-start gap-2">
                <Pressable onPress={() => updateBrandingData({ welcomeScreenEnabled: !brandingData.welcomeScreenEnabled })} className="flex-1">
                    <Text className="text-xl leading-none">
                        Show Welcome Screen
                    </Text>
                    <Text className="text-xl">
                        On App Launch?
                    </Text>
                    <Text className="text-text-secondary" style={{ marginTop: 2 }}>Clients always see it for a warm welcome</Text>
                </Pressable>
                <Switch
                    checked={brandingData.welcomeScreenEnabled || false}
                    onCheckedChange={(checked) => updateBrandingData({ welcomeScreenEnabled: checked })}
                />
            </View>

            <LocationModal
                visible={isLocationModalVisible}
                onClose={handleCloseModal}
                onLocationSelect={handleLocationSelect}
                selectedLocation={editingLocation}
            />

            <Modal
                visible={optionOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setOptionOpen(false)}
            >
                <View className="flex-1 justify-center p-4">
                    <Pressable
                        className="absolute inset-0 bg-black/50"
                        onPress={() => setOptionOpen(false)}
                    />
                    <View className="bg-background-secondary p-4 rounded-2xl">
                        <View className="mb-2">
                            <Text className="text-lg font-semibold">Select Image</Text>
                            <Text className="text-text-secondary mt-1">Choose how you want to add an image</Text>
                        </View>
                        <View className='flex-row gap-2 items-center justify-center'>
                            <Button onPress={takePhoto}>
                                <Text>Camera</Text>
                            </Button>
                            <Button onPress={pickImage}>
                                <Text>Photo Library</Text>
                            </Button>
                            <Button onPress={() => setOptionOpen(false)} variant='outline'>
                                <Text>Cancel</Text>
                            </Button>
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
                <View className="flex-1 justify-center p-4">
                    <Pressable
                        className="absolute inset-0 bg-black/50"
                        onPress={() => setOptionOpen(false)}
                    />
                    <View className="flex-1 justify-center items-center">
                        <Pressable
                            className="flex-1 w-full justify-center items-center"
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
                    </View>
                </View>
            </Modal>
        </View>
    );
};