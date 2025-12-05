import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClientHeader from '@/components/lib/client-header';
import { View, Image, ImageBackground, ActivityIndicator, Dimensions, Modal, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '@/lib/redux/store';
import { RootState } from '@/lib/redux/store';
import { fetchArtistProfile } from '@/lib/redux/slices/artist-slice';
import { getArtistFlashs } from '@/lib/services/flash-service';
import { ArtistFlash } from '@/lib/types';
import { useToast } from '@/lib/contexts/toast-context';

import BACK_IMAGE from '@/assets/images/icons/arrow_left.png';
import ClaimFlashModal from './claim-flash-modal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Flash() {
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const artist = useSelector((state: RootState) => state.artist.artist);

  const [flashs, setFlashs] = useState<ArtistFlash[]>([]);
  const [loading, setLoading] = useState(true);
  const [watermarkDimensions, setWatermarkDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);
  const [isClaimFlashModalVisible, setIsClaimFlashModalVisible] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState<ArtistFlash | null>(null);

  const handleBack = () => {
    router.back();
  };

  // Fetch full artist profile with app settings if not available
  useEffect(() => {
    if (artist?.id && !artist?.app) {
      dispatch(fetchArtistProfile(artist.id));
    }
  }, [artist?.id, artist?.app, dispatch]);

  useEffect(() => {
    if (artist?.id) {
      loadFlashs();
      loadWatermarkDimensions();
    }
  }, [artist?.id]);

  const loadWatermarkDimensions = async () => {
    const appSettings = Array.isArray(artist?.app) ? artist.app[0] : artist?.app;
    if (!appSettings?.watermark_image) return;

    try {
      const dimensions = await getImageDimensions(appSettings.watermark_image);
      setWatermarkDimensions(dimensions);
    } catch (error) {
      console.error('Error getting watermark dimensions:', error);
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

  const renderWatermark = (containerWidth: number, containerHeight: number, maxSize: number = 100) => {
    console.log("here called");
    console.log("artist?.app ====?>", artist?.app);

    const appSettings = Array.isArray(artist?.app) ? artist.app[0] : artist?.app;
    console.log("appSettings?.watermark_enabled ====?>", appSettings?.watermark_enabled);

    if (!appSettings?.watermark_enabled) return null;

    const settings = appSettings;
    const opacity = (settings.watermark_opacity || 50) / 100;

    console.log('Rendering watermark for:', settings.watermark_image);
    console.log('settings:', settings);

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

  const loadFlashs = async () => {
    if (!artist?.id) return;

    setLoading(true);
    const result = await getArtistFlashs(artist.id);

    if (result.success) {
      setFlashs(result.data || []);
    } else {
      toast({
        variant: 'error',
        title: 'Error',
        description: result.error || 'Failed to load flash',
        duration: 3000,
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ height: 200 }}>
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-text-secondary">Loading flash...</Text>
      </View>
    );
  }

  if (flashs.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="text-text-secondary text-center">
          No flash available yet.
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
          <View className='py-4'>
            <Text className="text-center text-text-secondary">
                Browse My Flash and Claim It Here!
            </Text>
          </View>

          <View className="gap-6">
            {/* Group flashs into pairs for grid layout */}
            {Array.from({ length: Math.ceil(flashs.length / 2) }, (_, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-4">
                {flashs.slice(rowIndex * 2, rowIndex * 2 + 2).map((flash) => (
                    <Pressable
                      key={flash.id}
                      onPress={() => {
                        setSelectedFlash(flash);
                        setIsClaimFlashModalVisible(true);
                      }}
                      style={{ borderRadius: 8, overflow: 'hidden', height: 216, flex: 1 }}
                      className="relative"
                    >
                      <ImageBackground
                        source={{ uri: flash.flash_image }}
                        style={{ height: 216, flex: 1 }}
                        className="items-start justify-end overflow-hidden rounded-lg bg-border relative"
                        resizeMode="cover">
                        {renderWatermark(((screenWidth - 32 - 16) / 2), 216, 50)}
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,1)']}
                          locations={[0, 1]}
                          className="h-1/2 w-full flex-row items-end justify-between px-2 py-4">
                          <Text className="text-white flex-1" numberOfLines={2}>
                            {flash.flash_name}
                          </Text>
                          {flash.flash_price != null && flash.flash_price > 0 ? (
                            <Text className="text-white font-semibold">
                              ${flash.flash_price.toString()}
                            </Text>
                          ) : null}
                      </LinearGradient>
                    </ImageBackground>
                  </Pressable>
                ))}
                {/* Add empty view if odd number of items in the last row */}
                {rowIndex === Math.floor(flashs.length / 2) && flashs.length % 2 === 1 && (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            ))}
          </View>
        </View>
      </KeyboardAwareScrollView>
      
      <ClaimFlashModal
        visible={isClaimFlashModalVisible}
        onClose={() => setIsClaimFlashModalVisible(false)}
        flash={selectedFlash || undefined}
        getImageDimensions={getImageDimensions}
        calculateOptimalDimensions={calculateOptimalDimensions}
        renderWatermark={renderWatermark}
        onClaim={() => {}}
      />
    </View>
  );
}
