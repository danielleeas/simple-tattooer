import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { Pressable, View, Image, type ImageStyle } from 'react-native';
import { Settings2 } from 'lucide-react-native';
import { router } from 'expo-router';

import { RootState } from '@/lib/redux/store';
import { setShowPurchase } from '@/lib/redux/slices/ui-slice';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import Splash from '@/components/lib/Splash';
import SubscribeModal from '@/components/lib/subscribe-modal';

import MENU from '@/assets/images/icons/menu.png';
import LOVE from '@/assets/images/icons/love.png';
import DRAWING from '@/assets/images/icons/drawing.png';
import ALERT from '@/assets/images/icons/alert.png';
import GEAR from '@/assets/images/icons/gear.png';
import CALENDAR from '@/assets/images/icons/calendar.png';

const ICON_STYLE: ImageStyle = {
    height: 56,
    width: 56,
};

interface PreviewHomeProps {
    mode: 'preview' | 'production';
}

export default function PreviewHome({ mode }: PreviewHomeProps) {

    const showSplash = useAppSelector((state: RootState) => state.ui.showSplash)
    const dispatch = useAppDispatch();

    const handleMenu = () => {
        router.push('/preview/menu');
    }

    const handleClients = () => {
        router.push('/preview/clients');
    };

    const handleDrawings = () => {
        router.push('/preview/drawings');
    };

    const handleToday = () => {
        dispatch(setShowPurchase(true));
    };

    const handleAlert = () => {
        router.push('/preview/alert');
    };

    const handleCalendar = () => {
        // router.push('/preview/calendar');
    };

    const handleSettings = () => {
        router.push('/preview/settings');
    };

    return (
        <>
            <StableGestureWrapper
                onSwipeLeft={handleMenu}
                threshold={100}
                enabled={true}
            >
                <View className='flex-1 relative overflow-hidden'>
                    {showSplash && <Splash isAuthenticated={false} welcome_enabled={false} mode={mode} />}
                    <View className='z-10 absolute top-4 right-4 h-10 w-10 items-center justify-center'>
                        <Pressable onPress={() => dispatch(setShowPurchase(true))}>
                            <Icon as={Settings2} size={24} />
                        </Pressable>
                    </View>
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
                                    <Text className='text-xs text-text-secondary'>Subscribe to unlock full features</Text>
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
            <SubscribeModal />
        </>
    );
}