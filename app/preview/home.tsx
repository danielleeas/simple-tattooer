import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { Text } from '@/components/ui/text';

export default function PreviewHome() {

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
                <Text>Preview Home</Text>
            </StableGestureWrapper>
        </>
    );
}