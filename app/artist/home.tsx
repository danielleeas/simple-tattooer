import { Text } from '@/components/ui/text';
import React, { useMemo } from 'react';
import { type ImageStyle, View, Pressable, Image } from 'react-native';

import Splash from '@/components/lib/Splash';
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

const ICON_STYLE: ImageStyle = {
    height: 56,
    width: 56,
};

export default function ProductionHome() {
    const { showSplash, showWelcome } = useAppSelector((state: RootState) => state.ui);
    const { artist, mode } = useAuth();

    const welcomeEnabled = useMemo(() => {
        return artist?.app?.welcome_screen_enabled || false;
    }, [artist]);


    const handleMenu = () => {
        router.push('/artist/menu');
    }

    const handleClients = () => {
        router.push('/artist/clients/search');
    };

    const handleToday = () => {
        // router.push('/production/today');
    };

    const handleAlert = () => {
        // router.push('/preview/alert');
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
                            <Button onPress={handleToday} size='sm' className='items-center justify-center py-2 h-8 px-3 gap-2 mt-3 border border-border rounded-lg bg-background-secondary'>
                                <Image source={require('@/assets/images/icons/info_circle.png')} style={{ width: 16, height: 16 }} resizeMode="contain" />
                                <Text className='text-xs text-text-secondary'>Tap "Today" to see your schedule</Text>
                            </Button>
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
            </View>
        </StableGestureWrapper>
    )
}