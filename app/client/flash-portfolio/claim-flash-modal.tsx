import React, { useState } from 'react';
import { View, Image, ImageBackground, Modal, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LinearGradient } from 'expo-linear-gradient';
import { ArtistFlash } from '@/lib/types';

interface ClaimFlashModalProps {
    visible: boolean;
    onClose: () => void;
    flash?: ArtistFlash;
    onClaim: (modificationMessage?: string) => void;
    getImageDimensions: (imageUri: string) => Promise<{ width: number; height: number; aspectRatio: number }>;
    calculateOptimalDimensions: (imageDimensions: { width: number; height: number; aspectRatio: number }) => { width: number; height: number; };
    renderWatermark: (containerWidth: number, containerHeight: number, maxSize: number) => React.ReactNode;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ClaimFlashModal({
    visible,
    onClose,
    flash,
    onClaim,
    getImageDimensions,
    calculateOptimalDimensions,
    renderWatermark
}: ClaimFlashModalProps) {
    const [modificationMessage, setModificationMessage] = useState<string>('');
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const [viewerImageDimensions, setViewerImageDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);

    const handleClaim = () => {
        if (!flash) return;
        
        // Navigate to booking form with flash data
        const params = {
            flashImage: flash.flash_image,
            flashName: flash.flash_name,
            flashPrice: flash.flash_price?.toString() || '',
            modificationMessage: modificationMessage.trim() || '',
        };
        
        router.push({
            pathname: '/client/appointments/booking-form',
            params: params as any,
        });
        
        // Call onClaim callback if provided
        onClaim(modificationMessage.trim() || undefined);
        setModificationMessage('');
        onClose();
    };

    const handleClose = () => {
        setModificationMessage('');
        onClose();
    };


    const handleImagePress = async (imageSource: any) => {
        try {
            // Convert URI string to proper format for Image component
            const imageToShow = typeof imageSource === 'string' ? { uri: imageSource } : imageSource;
            setSelectedImageSource(imageToShow);

            // Get image dimensions
            const imageUri = typeof imageSource === 'string' ? imageSource : imageSource.uri;
            const dimensions = await getImageDimensions(imageUri);

            setViewerImageDimensions(dimensions);
            setIsImageViewerVisible(true);
        } catch (error) {
            console.error('Error getting image dimensions:', error);
            // Fallback to showing image without dimension optimization
            const imageToShow = typeof imageSource === 'string' ? { uri: imageSource } : imageSource;
            setSelectedImageSource(imageToShow);
            setViewerImageDimensions(null);
            setIsImageViewerVisible(true);
        }
    };

    const handleCloseImageViewer = () => {
        setIsImageViewerVisible(false);
        setSelectedImageSource(null);
        setViewerImageDimensions(null);
    };

    if (!flash) return null;

    return (
        <>
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleClose}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <Pressable
                        style={{ flex: 1 }}
                        onPress={handleClose}
                    />
                    <View className="bg-background-secondary rounded-t-3xl px-6 pt-8 pb-10 gap-6">
                        {/* Icon and Title */}
                        <View className="items-center gap-4">
                            <Image
                                source={require('@/assets/images/icons/flash.png')}
                                style={{ width: 56, height: 56 }}
                                resizeMode="contain"
                            />
                            <Text variant="h3" className="text-center">Claim This Piece?</Text>
                        </View>

                        {/* Instructional Text */}
                        <Text className="text-center text-text-secondary text-sm">
                            Please double-check that you selected the correct pieces to claim.
                        </Text>

                        {/* Flash Preview */}
                        <View className="relative rounded-lg overflow-hidden" style={{ height: 200 }}>
                            <Pressable
                                key={flash.id}
                                onPress={() => handleImagePress(flash.flash_image)}
                                style={{ borderRadius: 8, overflow: 'hidden', height: 200, flex: 1 }}
                                className="relative"
                            >
                                <ImageBackground
                                    source={{ uri: flash.flash_image }}
                                    style={{ flex: 1 }}
                                    className="items-start justify-end"
                                    resizeMode="cover"
                                >
                                    {renderWatermark(((screenWidth - 32 - 16) / 2), 200, 50)}

                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,1)']}
                                        locations={[0, 1]}
                                        className="h-1/2 w-full flex-row items-end justify-between px-4 py-3"
                                    >
                                        <Text className="text-white flex-1" numberOfLines={2}>
                                            {flash.flash_name}
                                        </Text>
                                        {flash.flash_price != null && flash.flash_price > 0 && (
                                            <Text className="text-white font-semibold ml-2">
                                                ${flash.flash_price.toString()}
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </ImageBackground>
                            </Pressable>
                        </View>

                        {/* Modification Prompt */}
                        <View className="gap-2">
                            <Text variant="h5" className="text-md">
                                Are there any modifications to this piece you'd like us to consider? (Ex: Color, size, placement) Changes may affect the price.
                            </Text>
                        </View>

                        {/* Text Input */}
                        <Textarea
                            placeholder="Type your message here"
                            className="min-h-24 w-full"
                            value={modificationMessage}
                            onChangeText={setModificationMessage}
                        />

                        {/* Action Buttons */}
                        <View className="flex-row gap-3 pt-2">
                            <View className="flex-1">
                                <Button onPress={handleClose} variant="outline">
                                    <Text>Cancel</Text>
                                </Button>
                            </View>
                            <View className="flex-1">
                                <Button onPress={handleClaim}>
                                    <Text>Claim</Text>
                                </Button>
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
                    {viewerImageDimensions && (
                        <View className="overflow-hidden relative" style={calculateOptimalDimensions(viewerImageDimensions)}>
                            <Image
                                source={selectedImageSource}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="contain"
                            />
                            {renderWatermark(calculateOptimalDimensions(viewerImageDimensions).width, calculateOptimalDimensions(viewerImageDimensions).height, 50)}
                        </View>
                    )}
                </Pressable>
            </Modal>
        </>

    );
}
