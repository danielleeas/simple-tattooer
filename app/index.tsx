import * as React from 'react';
import { useState } from 'react';
import { Stack, router } from 'expo-router';
import { View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';

import { useAuth } from '@/lib/contexts';
import { useAppDispatch } from '@/lib/redux/hooks';
import { clearArtist } from '@/lib/redux/slices/artist-slice';

import PreviewHome from '@/app/preview/home';
import ArtistHome from './artist/home';
import ClientHome from './client/home';

export default function Screen() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, mode, isLoading, client } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  console.log("mode", mode);

  // Clear artist data on app start
  React.useEffect(() => {
    dispatch(clearArtist());
  }, [dispatch]);

  // Handle client home redirect
  React.useEffect(() => {
    if (mode === 'client' && client?.id) {
      // const clientId = client?.id;
      // const url = clientId ? `/client/home?client_id=${clientId}` : '/client/home';
      // router.push(url as any);
      setClientId(client?.id);
    }
  }, [mode, client?.id]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        <SafeAreaView className='flex-1'>
          <View className='flex-1 relative overflow-hidden'>
            <View className='flex-1 bg-background absolute top-0 left-0 right-0 bottom-0 items-center justify-center z-[1000]'>
              <View className='w-[140px] h-[140px] bg-[#000000] rounded-[30px] items-center justify-center'>
                <Image source={require('@/assets/images/logo_text.png')} style={{ width: 140, height: 140 }} resizeMode="contain" />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        <SafeAreaView className='flex-1'>
          <PreviewHome mode={mode} />
        </SafeAreaView>
      </>
    );
  }

  if ( isAuthenticated && mode === 'client' && clientId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        <SafeAreaView className='flex-1'>
          <ClientHome mode={mode} clientId={clientId} />
        </SafeAreaView>
      </>
    );
  }


  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <SafeAreaView className='flex-1 bg-background'>
        <ArtistHome />
      </SafeAreaView>
    </>
  );
}