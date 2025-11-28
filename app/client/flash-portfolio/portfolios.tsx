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
import { getArtistPortfolios } from '@/lib/services/portfolio-service';
import { ArtistPortfolio } from '@/lib/types';
import { useToast } from '@/lib/contexts/toast-context';

import BACK_IMAGE from '@/assets/images/icons/arrow_left.png';

export default function Portfolio() {
  const { toast } = useToast();
  const artist = useSelector((state: RootState) => state.artist.artist);

  const [portfolios, setPortfolios] = useState<ArtistPortfolio[]>([]);
  const [loading, setLoading] = useState(true);

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
                  <ImageBackground
                    key={portfolio.id}
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
    </View>
  );
}
