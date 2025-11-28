import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClientHeader from '@/components/lib/client-header';
import { View, Image, ImageBackground, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { getArtistFlashs } from '@/lib/services/flash-service';
import { ArtistFlash } from '@/lib/types';
import { useToast } from '@/lib/contexts/toast-context';

import BACK_IMAGE from '@/assets/images/icons/arrow_left.png';

export default function Flash() {
  const { toast } = useToast();
  const artist = useSelector((state: RootState) => state.artist.artist);

  const [flashs, setFlashs] = useState<ArtistFlash[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    if (artist?.id) {
      loadFlashs();
    }
  }, [artist?.id]);

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
                  <ImageBackground
                    key={flash.id}
                    source={{ uri: flash.flash_image }}
                    style={{ height: 216, flex: 1 }}
                    className="items-start justify-end overflow-hidden rounded-lg bg-border"
                    resizeMode="cover">
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,1)']}
                      locations={[0, 1]}
                      className="h-1/2 w-full flex-row items-end justify-between px-2 py-4">
                      <Text className="text-white flex-1" numberOfLines={2}>
                        {flash.flash_name}
                      </Text>
                      {flash.flash_price && (
                        <Text className="text-white font-semibold">
                          ${flash.flash_price.toString()}
                        </Text>
                      )}
                    </LinearGradient>
                  </ImageBackground>
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
    </View>
  );
}
