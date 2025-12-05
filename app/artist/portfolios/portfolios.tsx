import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { View, Image, Pressable, ActivityIndicator, Dimensions, Keyboard, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Icon } from "@/components/ui/icon";
import { Plus } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/contexts/toast-context";
import { useEffect, useMemo, useState } from "react";
import { THEME } from "@/lib/theme";
import { ArtistPortfolio, CreatePortfolioData } from "@/lib/types";
import { useAuth } from "@/lib/contexts";
import { createPortfolio, deletePortfolio, getArtistPortfolios, upsertPortfolios } from "@/lib/services/portfolio-service";
import * as ExpoImagePicker from 'expo-image-picker';
import { uploadFileToStorage } from "@/lib/services/storage-service";
import { compressImage } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface MediaChunk {
    id?: string;
    artist_id?: string;
    portfolio_name?: string;
    portfolio_image?: string;
    portfolio_description?: string;
    created_at?: string;
    updated_at?: string;
    chunk_type: string; // 'portfolio' | 'uploading'
    progress?: number;
    status?: 'uploading' | 'completed' | 'error';
}

const { width } = Dimensions.get('window');

export default function UploadPortfolios() {
    const { toast } = useToast();
    const { artist } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [originalPortfolios, setOriginalPortfolios] = useState<ArtistPortfolio[]>([]);
    const [portfolios, setPortfolios] = useState<ArtistPortfolio[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingPortfolioId, setDeletingPortfolioId] = useState<string | null>(null);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const [uploadingImages, setUploadingImages] = useState<{ id: string, progress: number, status: 'uploading' | 'completed' | 'error', imageUri: string }[]>([]);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);
    const [watermarkDimensions, setWatermarkDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    useEffect(() => {
        loadPortfolios();
        loadWatermarkDimensions();
    }, []);

    const hasChanges = useMemo(() => {
        const isSame = JSON.stringify(portfolios) === JSON.stringify(originalPortfolios);
        return !isSame;
    }, [portfolios, originalPortfolios]);

    const loadWatermarkDimensions = async () => {
        if (!artist?.app?.watermark_image) return;

        try {
            const dimensions = await getImageDimensions(artist.app.watermark_image);
            setWatermarkDimensions(dimensions);
        } catch (error) {
            console.error('Error getting watermark dimensions:', error);
        }
    };

    const loadPortfolios = async () => {
        if (!artist?.id) return;

        setLoading(true);
        try {
            const result = await getArtistPortfolios(artist.id);
            if (result.success && result.data) {
                setPortfolios(result.data);
                setOriginalPortfolios(result.data);
            } else {
                toast({
                    variant: 'error',
                    title: 'Error loading portfolios',
                    description: result.error || 'Failed to load portfolios',
                });
            }
        } catch (error) {
            console.error('Error loading portfolios:', error);
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Failed to load portfolios',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSavePortfolio = async () => {
        // Only save portfolios that have a non-empty name; skip unnamed ones
        const namedPortfolios = portfolios.filter(p => (p.portfolio_name || '').trim() !== '' || (p.portfolio_description || '').trim() !== '');
        if (namedPortfolios.length === 0) {
            toast({
                variant: 'error',
                title: 'Nothing to Save',
                description: 'No named portfolios to save yet.',
            });
            return;
        }
        if (!artist?.id) {
            toast({
                variant: 'error',
                title: 'Missing Artist',
                description: 'Cannot save without an artist id.',
            });
            return;
        }
        Keyboard.dismiss();
        setSaving(true);
        try {
            const updatesById = namedPortfolios.map(p => ({
                id: p.id as string,
                portfolio_name: p.portfolio_name,
                portfolio_description: p.portfolio_description,
            }));

            const upsertResult = await upsertPortfolios(artist.id, updatesById);

            if (!upsertResult.success) {
                toast({
                    variant: 'error',
                    title: 'Save Failed',
                    description: upsertResult.error || 'Failed to save portfolios.',
                });
                return;
            }

            toast({
                variant: 'success',
                title: 'Portfolios Updated',
                description: `${namedPortfolios.length} portfolio${namedPortfolios.length === 1 ? '' : 's'} saved successfully.`,
            });
            setOriginalPortfolios(portfolios);
        } catch (error) {
            console.error('Error saving portfolios:', error);
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Failed to save portfolios. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handlePortfolioDeleteConfirm = async () => {
        if (!deletingPortfolioId) return;

        setDeleting(true);

        try {
            // Delete from database first
            const deleteResult = await deletePortfolio(deletingPortfolioId);

            if (deleteResult.success) {
                // Remove portfolio from state
                setPortfolios(prevPortfolios => prevPortfolios.filter(p => p.id !== deletingPortfolioId));
                // Also update originalPortfolios to keep them in sync
                setOriginalPortfolios(prevPortfolios => prevPortfolios.filter(p => p.id !== deletingPortfolioId));

                toast({
                    variant: 'success',
                    title: 'Portfolio Deleted!',
                    description: 'You can always upload a portfolio if needed.',
                });
            } else {
                toast({
                    variant: 'error',
                    title: 'Delete Failed',
                    description: deleteResult.error || 'Failed to delete portfolio',
                });
            }
        } catch (error) {
            console.error('Error deleting portfolio:', error);
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Failed to delete portfolio',
            });
        } finally {
            setIsDeleteModalOpen(false);
            setDeletingPortfolioId(null);
            setDeleting(false);
        }
    };

    const handleAddNewPortfolio = async () => {
        try {
            const result = await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
            });

            if (!result.canceled && result.assets.length > 0) {
                // Create temporary portfolio entries immediately with local URIs
                const tempPortfolios: ArtistPortfolio[] = result.assets.map((asset, index) => ({
                    id: `temp_${Date.now()}_${index}`,
                    artist_id: artist?.id as string,
                    portfolio_name: '',
                    portfolio_image: asset.uri, // Show local image instantly
                    portfolio_description: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }));

                // Show images immediately
                setPortfolios(prev => [...prev, ...tempPortfolios]);
                setOriginalPortfolios(prev => [...prev, ...tempPortfolios]);

                // Upload in background (don't await)
                result.assets.forEach(async (asset, index) => {
                    const tempId = tempPortfolios[index].id;
                    try {
                        const compressedImage = await compressImage(asset.uri, 0.6);

                        const fileUpload = {
                            uri: compressedImage,
                            name: `portfolio_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`,
                            type: 'image/jpeg',
                            size: 0
                        };

                        const uploadResult = await uploadFileToStorage(fileUpload, 'artist-portfolios', artist?.id);

                        if (!uploadResult.success || !uploadResult.url) {
                            throw new Error(uploadResult.error || 'Failed to upload image');
                        }

                        const portfolioData: CreatePortfolioData = {
                            portfolio_name: '',
                            portfolio_image: uploadResult.url,
                            portfolio_description: ''
                        };

                        const createResult = await createPortfolio(artist?.id as string, portfolioData);

                        if (!createResult.success || !createResult.data) {
                            throw new Error(createResult.error || 'Failed to create portfolio');
                        }

                        // Only update the ID, keep local image URI visible
                        setPortfolios(prev => prev.map(p =>
                            p.id === tempId ? { ...p, id: createResult.data!.id } : p
                        ));
                        setOriginalPortfolios(prev => prev.map(p =>
                            p.id === tempId ? { ...p, id: createResult.data!.id } : p
                        ));
                    } catch (error) {
                        console.error('Error uploading portfolio:', error);
                        // Remove failed temp portfolio
                        setPortfolios(prev => prev.filter(p => p.id !== tempId));
                        setOriginalPortfolios(prev => prev.filter(p => p.id !== tempId));
                        toast({
                            variant: 'error',
                            title: 'Upload Failed',
                            description: 'Failed to upload image.',
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error picking images:', error);
            toast({
                title: 'Error',
                description: 'Failed to pick images.',
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

    const mediaChunks = useMemo(() => {
        // Create chunks for regular portfolios
        const portfolioChunks: MediaChunk[] = [...portfolios.map(portfolio => ({ ...portfolio, chunk_type: 'portfolio' }))];

        // Create chunks for uploading images
        const uploadingChunks: MediaChunk[] = [...uploadingImages.map(upload => ({
            id: upload.id,
            portfolio_image: upload.imageUri,
            chunk_type: 'uploading',
            progress: upload.progress,
            status: upload.status
        }))];

        const chunks: MediaChunk[] = [...portfolioChunks, ...uploadingChunks];

        // Chunk into arrays of 2 items
        const chunkSize = 2;
        const chunked: MediaChunk[][] = [];
        for (let i = 0; i < chunks.length; i += chunkSize) {
            chunked.push(chunks.slice(i, i + chunkSize));
        }

        return chunked;
    }, [loading, portfolios, uploadingImages]);

    const handleDeletePortfolio = (portfolioId: string) => {
        if (portfolioId && portfolioId.trim() !== '') {
            setDeletingPortfolioId(portfolioId);
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

            setImageDimensions(dimensions);

            setIsImageViewerVisible(true);
        } catch (error) {
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
    };

    return (
        <View style={{ width }} className="flex-1">
            <KeyboardAwareScrollView
                contentContainerClassName="w-full"
                showsVerticalScrollIndicator={false}
                bottomOffset={80}
                
            >
                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                    <View className="items-center justify-center" style={{ height: 180 }}>
                        <Image
                            source={require('@/assets/images/icons/portfolio.png')}
                            style={{ width: 56, height: 56 }}
                            resizeMode="contain"
                        />
                        <Text variant="h6" className="text-center uppercase">Portfolio</Text>
                        <Text variant="h6" className="text-center uppercase leading-none">upload</Text>
                        <Text className="text-center mt-2 text-text-secondary max-w-80">Show off your work — add titles if you like, keep it simple.</Text>
                    </View>
                    {mediaChunks.length === 0 && !loading && (
                        <View className="flex-1 items-center justify-center py-8">
                            <Text variant="h6" className="text-center text-text-secondary">No Portfolio Yet</Text>
                        </View>
                    )}

                    {loading ? (
                        <View className="flex-1 items-center justify-center py-8">
                            <ActivityIndicator size="large" color={THEME.dark.primary} />
                            <Text className="text-text-secondary mt-4">Loading portfolios...</Text>
                        </View>
                    ) : (
                        <View className="gap-4">
                            {mediaChunks.map((chunk, index) => (
                                <View key={index} className="flex-row gap-4">
                                    {chunk.map((item, itemIndex) => {
                                        if (item.chunk_type === 'uploading') {
                                            return (
                                                <View key={itemIndex} className="flex-1 gap-1">
                                                    <View className="relative">
                                                        <Image
                                                            source={{ uri: item.portfolio_image }}
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
                                                    onPress={() => handleImagePress(item.portfolio_image)}
                                                    style={{ borderRadius: 8, overflow: 'hidden', height: 216, width: '100%' }}
                                                    className="relative"
                                                >
                                                    <Image
                                                        source={item.portfolio_image ? { uri: item.portfolio_image } : require('@/assets/images/icons/portfolio.png')}
                                                        style={{ width: "100%", height: "100%" }}
                                                        resizeMode="cover"
                                                    />
                                                </Pressable>
                                                <Input
                                                    spellCheck={false}
                                                    autoComplete="off"
                                                    textContentType="none"
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                    placeholder="Title"
                                                    className="border-0 h-6 p-0 text-md"
                                                    value={item.portfolio_name || ''}
                                                    onChangeText={(text) => {
                                                        // Update portfolio name in the portfolios array immediately for UI
                                                        setPortfolios(portfolios.map(portfolio =>
                                                            portfolio.id === item.id ? { ...portfolio, portfolio_name: text } : portfolio
                                                        ));
                                                    }}
                                                />
                                                <Textarea
                                                    spellCheck={false}
                                                    autoComplete="off"
                                                    textContentType="none"
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                    placeholder="Description (Optional)"
                                                    className="border-0 p-0 text-sm"
                                                    value={item.portfolio_description || ''}
                                                    onChangeText={(text) => {
                                                        // Update portfolio description in the portfolios array immediately for UI
                                                        setPortfolios(portfolios.map(portfolio =>
                                                            portfolio.id === item.id ? { ...portfolio, portfolio_description: text } : portfolio
                                                        ));
                                                    }}
                                                />
                                                <View className="flex-row items-center gap-2 mt-1">
                                                    <Pressable className="flex-row gap-1 p-1" onPress={() => handleDeletePortfolio(item.id as string || '')}>
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
                                    {chunk.length === 1 && (
                                        <View className="flex-1 gap-1">
                                            <View style={{ borderRadius: 8, overflow: 'hidden', height: 216, width: '100%' }} />
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </KeyboardAwareScrollView>
            <View className="gap-4 px-4 py-4">
                {hasChanges ? (
                    <Button variant="outline" onPress={handleSavePortfolio} disabled={saving}>
                        {saving ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text>Save Changes</Text>
                        )}
                    </Button>
                ) : (
                    <Button variant="outline" onPress={handleAddNewPortfolio}>
                        <Text>Upload Your Tattoos</Text>
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
                                <Text variant="h3" className="text-center">Delete Portfolio</Text>
                                <Text className="text-text-secondary text-center text-sm leading-5">Are you sure? This action can't be undone.</Text>

                                <View className="gap-4 flex-row w-full">
                                    <View className="flex-1">
                                        <Button onPress={() => setIsDeleteModalOpen(false)} variant="outline" size='lg' className='items-center justify-center'>
                                            <Text>Cancel</Text>
                                        </Button>
                                    </View>
                                    <View className="flex-1">
                                        <Button variant="outline" disabled={deleting} onPress={handlePortfolioDeleteConfirm} size='lg' className='items-center justify-center'>
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
                        </View>
                    )}
                </Pressable>
            </Modal>
        </View>
    );
}