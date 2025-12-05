import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClientHeader from '@/components/lib/client-header';
import { View, Image, ImageBackground, ActivityIndicator, Modal, Pressable, Dimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { getArtistPortfolios } from '@/lib/services/portfolio-service';
import { ArtistPortfolio } from '@/lib/types';
import { useToast } from '@/lib/contexts/toast-context';

import BACK_IMAGE from '@/assets/images/icons/arrow_left.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Portfolio() {
  const { toast } = useToast();
  const artist = useSelector((state: RootState) => state.artist.artist);

  const [portfolios, setPortfolios] = useState<ArtistPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
  const [viewerImageDimensions, setViewerImageDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    if (artist?.id) {
      loadPortfolios();
    }
  }, [artist?.id]);

  const loadPortfolios = async () => {
    if (!artist?.id) return;

    setLoading(true);
    const result = await getArtistPortfolios(artist.id);

    if (result.success) {
      setPortfolios(result.data || []);
    } else {
      toast({
        variant: 'error',
        title: 'Error',
        description: result.error || 'Failed to load portfolios',
        duration: 3000,
      });
    }
    setLoading(false);
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ height: 200 }}>
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-text-secondary">Loading portfolios...</Text>
      </View>
    );
  }

  if (portfolios.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="text-text-secondary text-center">
          No portfolios available yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-6 pb-4 pt-2">
      <KeyboardAwareScrollView
        bottomOffset={50}
        contentContainerClassName="w-full"
        showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6 bg-background px-4 pb-8 pt-2">
          <View>
            <Text className="text-center text-text-secondary">
              Take A Browse Through My Work
            </Text>
            <Text className="text-center text-text-secondary">For Inspiration!</Text>
          </View>

          <View className="gap-6">
            {/* Group portfolios into pairs for grid layout */}
            {Array.from({ length: Math.ceil(portfolios.length / 2) }, (_, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-4">
                {portfolios.slice(rowIndex * 2, rowIndex * 2 + 2).map((portfolio) => (
                    <Pressable
                      key={portfolio.id}
                      onPress={() => handleImagePress(portfolio.portfolio_image)}
                      style={{ borderRadius: 8, overflow: 'hidden', height: 216, flex: 1 }}
                      className="relative"
                    >
                      <ImageBackground
                        source={{ uri: portfolio.portfolio_image }}
                        style={{ height: 216, flex: 1 }}
                        className="items-start justify-end overflow-hidden rounded-lg bg-border"
                        resizeMode="cover">
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,1)']}
                          locations={[0, 1]}
                          className="h-1/2 w-full flex-col items-start justify-end px-2 py-4">
                          <Text className="text-white font-semibold" numberOfLines={1}>
                            {portfolio.portfolio_name}
                          </Text>
                          {portfolio.portfolio_description && (
                            <Text className="text-white text-sm mt-1" numberOfLines={2}>
                              {portfolio.portfolio_description}
                            </Text>
                          )}
                      </LinearGradient>
                    </ImageBackground>
                  </Pressable>
                ))}
                {/* Add empty view if odd number of items in the last row */}
                {rowIndex === Math.floor(portfolios.length / 2) && portfolios.length % 2 === 1 && (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            ))}
          </View>
        </View>
      </KeyboardAwareScrollView>

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
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
