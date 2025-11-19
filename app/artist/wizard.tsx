import React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AnimatedWizard } from '@/components/wizard/AnimatedWizard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SetupWizardProvider } from '@/lib/contexts/setup-wizard-context';

export default function Wizard() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <View className='flex-1 relative overflow-hidden'>
                    <SetupWizardProvider>
                        <AnimatedWizard />
                    </SetupWizardProvider>
                </View>
            </SafeAreaView>
        </>
    );
}