import * as React from 'react';
import { Stack } from 'expo-router';
import { View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/contexts';

import PreviewHome from '@/app/preview/home';
import ClientHome from '@/app/client/home';
import ArtistHome from './artist/home';

export default function Screen() {
  const { isAuthenticated, mode, isLoading } = useAuth();

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

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <SafeAreaView className='flex-1 bg-background'>
        <ArtistHome />
      </SafeAreaView>
    </>
  );
}