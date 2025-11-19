import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { router } from 'expo-router';

export default function ArtistHome() {

    const handleMenu = () => {
        console.log('Menu');
    }

    const handleWizard = () => {
        router.push('/artist/wizard');
    }

    return (
        <>
            <StableGestureWrapper
                onSwipeLeft={handleMenu}
                threshold={100}
                enabled={true}
            >
                <Button onPress={handleWizard}>
                    <Text>Artist Home</Text>
                </Button>
            </StableGestureWrapper>
        </>
    );
}