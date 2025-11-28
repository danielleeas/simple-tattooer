import { router, Stack } from 'expo-router';
import { Image, View, Dimensions, Linking, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import ClientHeader from '@/components/lib/client-header';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { RootState } from '@/lib/redux/store';
import { GOOGLE_PLACES_API_KEY } from '@/lib/constants';
import BACK_IMAGE from '@/assets/images/icons/arrow_left.png';
// import { GoogleMaps } from 'expo-maps';


export default function FindMe() {
  const handleBack = () => {
    router.back();
  };

  // Get artist data from Redux store
  const artist = useSelector((state: RootState) => state.artist.artist);

  // Find the main studio location
  const mainStudioLocation = artist?.locations?.find(location => location.is_main_studio);

  // Parse coordinates if they exist
  let coordinates: { latitude: number; longitude: number } | null = null;
  try {
    if (mainStudioLocation?.coordinates) {
      coordinates = typeof mainStudioLocation.coordinates === 'string'
        ? JSON.parse(mainStudioLocation.coordinates)
        : mainStudioLocation.coordinates;

        console.log("coordinates ===>", coordinates);
        console.log("mainStudioLocation?.address ===>", mainStudioLocation?.address);
    }
  } catch (error) {
    console.warn('Error parsing coordinates:', error);  
  }

  const openInGoogleMaps = async () => {
    if (!coordinates) return;
    
    const { latitude, longitude } = coordinates;
    const address = encodeURIComponent(mainStudioLocation?.address || '');
    
    // Try to open in Google Maps app, fallback to web
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const appleMapsUrl = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${address}`;
    
    try {
      // Try Google Maps first
      const canOpen = await Linking.canOpenURL(googleMapsUrl);
      if (canOpen) {
        await Linking.openURL(googleMapsUrl);
      } else {
        // Fallback to Apple Maps on iOS
        await Linking.openURL(appleMapsUrl);
      }
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <SafeAreaView className="flex-1 bg-background">
        <ClientHeader
          leftButtonImage={BACK_IMAGE}
          leftButtonTitle="Back"
          onLeftButtonPress={handleBack}
        />
        <StableGestureWrapper onSwipeRight={handleBack} threshold={80} enabled={true}>
          <View className="flex-1 gap-6 pb-4 pt-2">
            <View className="flex-1">
              <KeyboardAwareScrollView
                bottomOffset={50}
                contentContainerClassName="w-full"
                showsVerticalScrollIndicator={false}>
                <View className="flex-1 gap-6 bg-background px-4 pb-8 pt-2">
                  <View className="items-center justify-center" style={{ height: 120 }}>
                    <Image
                      source={require('@/assets/images/icons/how_to_find.png')}
                      style={{ width: 56, height: 56 }}
                      resizeMode="contain"
                    />
                    <Text variant="h6" className="text-center uppercase">
                      how to
                    </Text>
                    <Text variant="h6" className="text-center uppercase leading-none">
                      find me
                    </Text>
                  </View>

                  <View className="gap-4">
                    <View className="gap-2">
                      <Text variant="h4">Main Studio Address</Text>
                      <Text>
                        If you are booked at a different location it will show in your dashboard &
                        confirmation email
                      </Text>
                    </View>

                    <Text className="text-text-secondary">
                      {mainStudioLocation?.address || 'Address not available'}
                    </Text>
                    <View>
                    {/* <GoogleMaps.View style={{ flex: 1 }} />; */}

                    </View>
                  </View>

                  <View className="gap-4">
                    <Text variant="h4">Contact Us</Text>
                    <View className="flex-row items-center justify-start gap-2">
                      <Image
                        source={require('@/assets/images/icons/instagram.png')}
                        style={{ width: 24, height: 24 }}
                        resizeMode="contain"
                      />
                      <Text className="text-text-secondary">instagram.com/crysalexart</Text>
                    </View>
                  </View>
                </View>
              </KeyboardAwareScrollView>
            </View>
          </View>
        </StableGestureWrapper>
      </SafeAreaView>
    </>
  );
}
