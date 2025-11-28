import { View } from 'react-native';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { Text } from '@/components/ui/text';
import { useAppSelector } from '@/lib/redux/hooks';
import { RootState } from '@/lib/redux/store';
import Splash from '@/components/lib/Splash';


interface ClientHomeProps {
    mode: 'preview' | 'production' | 'client';
}

export default function ClientHome({ mode }: ClientHomeProps) {
    const showSplash = useAppSelector((state: RootState) => state.ui as any).showSplash

    const handleMenu = () => {
        console.log('Menu');
    }

    return (
        <>
            <StableGestureWrapper
                onSwipeLeft={handleMenu}
                threshold={100}
                enabled={true}
            >
                <View className='flex-1 relative overflow-hidden'>
                    {showSplash && <Splash isAuthenticated={true} welcome_enabled={false} mode={mode} />}

                    <Text>Client Home</Text>
                </View>
            </StableGestureWrapper>
        </>
    );
}