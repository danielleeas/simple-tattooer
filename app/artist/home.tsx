import { router } from 'expo-router';

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/lib/loading-overlay';
import { useState, useEffect } from 'react';

export default function ArtistHome() {

    const [progress, setProgress] = useState(0);

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