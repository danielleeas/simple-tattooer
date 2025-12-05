import { View, Image, Dimensions, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, router, RelativePathString } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { useCallback, useEffect, useRef, useState } from 'react';
import { findClientById } from '@/lib/services/clients-service';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { RootState } from '@/lib/redux/store';
import { signinWithAuth } from '@/lib/redux/slices/auth-slice';
import { fetchArtistProfile } from '@/lib/redux/slices/artist-slice';
import { setShowWelcome } from '@/lib/redux/slices/ui-slice';
import { useToast } from '@/lib/contexts/toast-context';
import Splash from '@/components/lib/Splash';
import Welcome from '@/components/lib/welcome';

import LOGO from '@/assets/images/logo.png';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';

const { height: screenHeight } = Dimensions.get('window');

export default function ClientPortal() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const hasSignedIn = useRef(false);
  const { id, artist_id } = useLocalSearchParams<{ id: string; artist_id: string }>();

  console.log(id, artist_id);

  const selectedArtist = useAppSelector((state: RootState) => state.artist.artist);
  const showSplash = useAppSelector((state: RootState) => state.ui as any).showSplash;
  const showWelcome = useAppSelector((state: RootState) => (state.ui as any).showWelcome);

  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  const loadClient = useCallback(async () => {
    const client = await findClientById(id);
    console.log('client', client);
    setClient(client);
  }, [id]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  // Fetch artist profile when artist_id is loaded
  useEffect(() => {
    if (artist_id) {
      dispatch(fetchArtistProfile(artist_id));
    }
  }, [artist_id, dispatch]);

  // Show welcome screen when artist is loaded
  useEffect(() => {
    if (!showSplash && selectedArtist?.photo && !hasShownWelcome) {
      dispatch(setShowWelcome(true));
      setHasShownWelcome(true);
    }
  }, [selectedArtist, showSplash, hasShownWelcome, dispatch]);

  const handleSignin = async (client: any) => {
    try {
      setLoading(true);
      console.log('signing in', client);
      const resultAction = await dispatch(
        signinWithAuth({
          email: client.email,
          password: client.email,
        })
      );

      if (signinWithAuth.fulfilled.match(resultAction)) {
        const { client, session } = resultAction.payload;

        // Show success message
        toast({
          title: 'Welcome Back!',
          description: 'You have successfully signed in.',
          variant: 'success',
          duration: 3000,
        });
      } else if (signinWithAuth.rejected.match(resultAction)) {
        // Handle signin error
        const errorMessage = (resultAction.payload as string) || 'Failed to sign in';
        console.log('error', errorMessage);
        toast({
          title: 'Signin Failed',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (client && !hasSignedIn.current) {
      hasSignedIn.current = true;
      handleSignin(client);
    }
  }, [client]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1 items-center justify-center bg-background">
            <Image source={LOGO} style={{ width: 140, height: 140 }} resizeMode="contain" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  console.log(client);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <StableGestureWrapper
        onSwipeLeft={() => {}}
        threshold={100}
        enabled={!!selectedArtist}
      >
        <View className='flex-1 relative overflow-hidden'>
          {showSplash && <Splash isAuthenticated={true} welcome_enabled={false} mode="client" />}

          {/* Show welcome screen after splash */}
          {!showSplash && selectedArtist && showWelcome && (
            <Welcome artist={selectedArtist} />
          )}

          {/* Only show content after splash animation completes */}
          {!showSplash && !showWelcome && (
            <SafeAreaView className="flex-1 bg-background">
              <View
                className="flex-1 justify-center gap-6 bg-background px-4"
                style={{ paddingVertical: screenHeight * 0.08 }}>
                <View className="flex-1 justify-around">
                  <View className="w-full flex-row items-center justify-center">
                    <View className="h-full items-center">
                      <Pressable className="items-center justify-end" onPress={() => router.push('/client/message' as RelativePathString)}>
                        <Image
                          source={require('@/assets/images/icons/message.png')}
                          style={{ width: 56, height: 56 }}
                        />
                        <Text variant="h6" className="uppercase">
                          Messages
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <View className="w-full flex-row items-center justify-between">
                    <View className="h-full w-[140px] items-center">
                      <Pressable className="items-center justify-end" onPress={() => router.push('/client/payments' as RelativePathString)}>
                        <Image
                          source={require('@/assets/images/icons/money_bag.png')}
                          style={{ width: 56, height: 56 }}
                        />
                        <Text variant="h6" className="uppercase">
                          Payment
                        </Text>
                        <Text variant="h6" className="uppercase leading-none">
                          Info
                        </Text>
                      </Pressable>
                    </View>
                    <View className="h-full w-[140px] items-center">
                      <Pressable className="items-center justify-end" onPress={() => router.push('/client/dates' as RelativePathString)}>
                        <Image
                          source={require('@/assets/images/icons/calendar.png')}
                          style={{ width: 56, height: 56 }}
                        />
                        <Text variant="h6" className="uppercase">
                          Your
                        </Text>
                        <Text variant="h6" className="uppercase leading-none">
                          Dates
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <View className="gw-full items-center justify-between">
                    <Text variant="h1" className="">
                      Start Here.
                    </Text>
                    <Text variant="h1" className="leading-none">
                      Stress Less.
                    </Text>
                  </View>
                  <View className="gap-4">
                    <View className="w-full flex-row items-center justify-between">
                      <View className="h-full w-[140px] items-center">
                        <Pressable className="items-center justify-end" onPress={() => router.push('/client/flash-portfolio/' as RelativePathString)}>
                          <Image
                            source={require('@/assets/images/icons/portfolio.png')}
                            style={{ width: 56, height: 56 }}
                          />
                          <Text variant="h6" className="uppercase">
                            flash/
                          </Text>
                          <Text variant="h6" className="uppercase leading-none">
                            portfolio
                          </Text>
                        </Pressable>
                      </View>
                      <View className="h-full w-[140px] items-center">
                        <Pressable className="items-center justify-end" onPress={() => router.push('/client/findme' as RelativePathString)}>
                          <Image
                            source={require('@/assets/images/icons/how_to_find.png')}
                            style={{ width: 56, height: 56 }}
                          />
                          <Text variant="h6" className="uppercase">
                            How to
                          </Text>
                          <Text variant="h6" className="uppercase leading-none">
                            find me
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                    <View className="w-full flex-row items-center justify-center">
                      <View className="h-full items-center">
                        <Pressable className="items-center justify-end" onPress={() => router.push('/client/faq-aftercare' as any)}>
                          <Image
                            source={require('@/assets/images/icons/question.png')}
                            style={{ width: 56, height: 56 }}
                          />
                          <Text variant="h6" className="uppercase">
                            Faqs/
                          </Text>
                          <Text variant="h6" className="uppercase leading-none">
                            aftercare
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          )}
        </View>
      </StableGestureWrapper>
    </>
  );
}
