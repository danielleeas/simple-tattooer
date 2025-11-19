import { Stack } from 'expo-router';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/contexts';

import PreviewHome from '@/app/preview/home';

export default function Screen() {
  const { isAuthenticated, mode, isLoading } = useAuth();

  console.log('isAuthenticated', isAuthenticated);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <SafeAreaView className='flex-1 bg-background'>
        <PreviewHome />
      </SafeAreaView>
    </>
  );
}