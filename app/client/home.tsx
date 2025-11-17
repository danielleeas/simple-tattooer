import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { Text } from '@/components/ui/text';

export default function ClientHome() {

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
                <Text>Client Home</Text>
            </StableGestureWrapper>
        </>
    );
}