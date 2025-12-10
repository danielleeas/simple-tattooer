import { Text } from '@/components/ui/text';
import React, { useMemo, useState, useEffect } from 'react';
import { type ImageStyle, View, Pressable, Image, Alert, Linking, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Splash from '@/components/lib/splash';
import Welcome from '@/components/lib/welcome';

import MENU from '@/assets/images/icons/menu.png';
import LOVE from '@/assets/images/icons/love.png';
import DRAWING from '@/assets/images/icons/drawing.png';
import ALERT from '@/assets/images/icons/alert.png';
import GEAR from '@/assets/images/icons/gear.png';
import CALENDAR from '@/assets/images/icons/calendar.png';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { useAppSelector } from '@/lib/redux/hooks';
import { RootState } from '@/lib/redux/store';
import { router } from 'expo-router';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { formatYmd } from '@/lib/utils';
import { generateAndUploadQRCode } from '@/lib/services/qrcode-service';
import { useToast } from '@/lib/contexts/toast-context';

const ICON_STYLE: ImageStyle = {
    height: 56,
    width: 56,
};

export default function ProductionHome() {
    const { showSplash, showWelcome } = useAppSelector((state: RootState) => state.ui);
    const { artist, mode } = useAuth();
    const { toast } = useToast();
    const [showTooltip, setShowTooltip] = useState(false);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('today_tooltip_dismissed').then((value) => {
            if (value !== 'true') {
                setShowTooltip(true);
            }
        });
    }, []);

    const welcomeEnabled = useMemo(() => {
        const artistPhoto = artist?.photo;
        return artist?.app?.welcome_screen_enabled && artistPhoto ? true : false;
    }, [artist]);


    const handleMenu = () => {
        router.push('/artist/menu');
    }

    const handleClients = () => {
        router.push('/artist/clients/search');
    };

    const handleToday = () => {
        const currentDate = new Date();
        const dateString = formatYmd(currentDate);
        router.push({
            pathname: '/artist/calendar/day-click',
            params: { date: dateString },
        });

        setTimeout(() => {
            if (showTooltip) {
                setShowTooltip(false);
                AsyncStorage.setItem('today_tooltip_dismissed', 'true');
            }
        }, 1000);
    };

    const handleAlert = () => {
        router.push('/artist/alert');
    };

    const handleDrawings = () => {
        router.push('/artist/drawings');
    };

    const handleCalendar = () => {
        router.push('/artist/calendar');
    };

    const handleSettings = () => {
        router.push('/artist/settings');
    };

    const handleTestQRCode = async () => {
        if (!artist?.booking_link || !artist?.id) {
            Alert.alert(
                'No Booking Link',
                'You need to complete the setup wizard to generate a booking link first.',
                [{ text: 'OK' }]
            );
            return;
        }

        setIsGeneratingQR(true);

        try {
            // Generate QR code
            const result = await generateAndUploadQRCode(artist.booking_link, artist.id);

            if (result.success && result.url) {
                Alert.alert(
                    'QR Code Generated! ✓',
                    `Your QR code has been successfully generated and uploaded to Supabase storage.\n\nURL: ${result.url}\n\nWould you like to open it?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open QR Code',
                            onPress: () => {
                                Linking.openURL(result.url!).catch((err) => {
                                    console.error('Failed to open URL:', err);
                                    toast({
                                        title: 'Error',
                                        description: 'Failed to open QR code URL',
                                        variant: 'error',
                                        duration: 2000,
                                    });
                                });
                            },
                        },
                    ]
                );

                toast({
                    title: 'Success!',
                    description: 'QR code generated successfully',
                    variant: 'success',
                    duration: 3000,
                });
            } else {
                Alert.alert(
                    'Generation Failed',
                    `Failed to generate QR code.\n\nError: ${result.error || 'Unknown error'}`,
                    [{ text: 'OK' }]
                );

                toast({
                    title: 'Error',
                    description: result.error || 'Failed to generate QR code',
                    variant: 'error',
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('Error testing QR code:', error);
            Alert.alert(
                'Error',
                `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
                [{ text: 'OK' }]
            );

            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'error',
                duration: 3000,
            });
        } finally {
            setIsGeneratingQR(false);
        }
    };

    return (
        <StableGestureWrapper
            onSwipeLeft={handleMenu}
            threshold={100}
            enabled={true}
        >
            <View className='flex-1 relative overflow-hidden'>
                {showSplash && <Splash isAuthenticated={true} welcome_enabled={welcomeEnabled} mode={mode} />}

                {welcomeEnabled && showWelcome && <Welcome />}

                <View className="flex-1 items-center justify-center gap-11 p-4 pb-6 bg-background">
                    <View className="gap-4 flex-1 w-full min-h-32 max-h-44 items-center justify-center flex-row">
                        <View className='flex-1 h-full items-center justify-end'>
                            <Pressable className='items-center justify-end' onPress={handleClients}>
                                <Image source={LOVE} style={ICON_STYLE} />
                                <Text variant="h6" className='uppercase' numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Clients</Text>
                            </Pressable>
                        </View>
                        <View className='flex-1 h-full items-center justify-start'>
                            <Pressable onPress={handleMenu} className='items-center justify-start'>
                                <Image source={MENU} style={ICON_STYLE} />
                                <Text variant="h6" className='uppercase' numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Menu</Text>
                            </Pressable>
                        </View>
                        <View className='flex-1 h-full items-center justify-end'>
                            <Pressable onPress={handleDrawings} className='items-center justify-end'>
                                <Image source={DRAWING} style={ICON_STYLE} />
                                <Text variant="h6" className='uppercase' numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Drawings</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View className='w-full items-center justify-center'>
                        <Pressable onPress={handleToday} className='gap-1 items-center justify-center'>
                            <Text variant="h1" >Today</Text>
                            <Text variant="h5" >Chase Your Dreams</Text>
                            {showTooltip && (
                                <Button onPress={handleToday} size='sm' className='items-center justify-center py-2 h-8 px-3 gap-2 mt-3 border border-border rounded-lg bg-background-secondary'>
                                    <Image source={require('@/assets/images/icons/info_circle.png')} style={{ width: 16, height: 16 }} resizeMode="contain" />
                                    <Text className='text-xs text-text-secondary'>Tap "Today" to see your schedule</Text>
                                </Button>
                            )}
                        </Pressable>
                    </View>

                    <View className="gap-4 mt-1 flex-1 w-full min-h-32 max-h-44 items-center justify-center flex-row">
                        <View className='flex-1 h-full items-center justify-start'>
                            <Pressable className='items-center justify-start' onPress={handleAlert}>
                                <Image source={ALERT} style={ICON_STYLE} />
                                <Text variant="h6" className='uppercase' numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>alerts</Text>
                            </Pressable>
                        </View>
                        <View className='flex-1 h-full items-center justify-end'>
                            <Pressable className='items-center justify-end' onPress={handleSettings}>
                                <Image source={GEAR} style={ICON_STYLE} />
                                <Text variant="h6" className='uppercase' numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>settings</Text>
                            </Pressable>
                        </View>
                        <View className='flex-1 h-full items-center justify-start'>
                            <Pressable className='items-center justify-start' onPress={handleCalendar}>
                                <Image source={CALENDAR} style={ICON_STYLE} />
                                <Text variant="h6" className='uppercase' numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>calendar</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Floating QR Code Test Button */}
                <View className='absolute bottom-6 right-6 z-50'>
                    <Pressable
                        onPress={handleTestQRCode}
                        disabled={isGeneratingQR}
                        className='bg-primary rounded-full w-16 h-16 items-center justify-center shadow-lg'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4.65,
                            elevation: 8,
                        }}
                    >
                        {isGeneratingQR ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text className='text-3xl text-background'>QR</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </StableGestureWrapper>
    )
}