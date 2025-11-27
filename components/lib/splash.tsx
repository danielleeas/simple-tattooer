import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { Image, type ImageStyle, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useAppDispatch } from '@/lib/redux/hooks';
import { hideSplash, setShowExtendSubscription, setShowPurchase, setShowWelcome } from '@/lib/redux/slices/ui-slice';

import LOGO from '@/assets/images/logo_text.png';

interface SplashProps {
    isAuthenticated: boolean;
    welcome_enabled: boolean;
    mode: 'preview' | 'production' | 'client';
}

const IMAGE_STYLE: ImageStyle = {
    height: 140,
    width: 140,
};

export default function Splash({ isAuthenticated, welcome_enabled, mode }: SplashProps) {
    const dispatch = useAppDispatch();
    const { height: windowHeight } = useWindowDimensions();

    const lineHeight = useSharedValue<number>(0);
    const lineWidth = useSharedValue<number>(5);
    const positionY = useSharedValue<number>(50); // Start at 50% (center)
    const animBoxHeight = useSharedValue<number>(140);
    const opacity = useSharedValue<number>(1);

    const leftLineStyle = useAnimatedStyle(() => {
        return {
            width: lineWidth.value,
            height: lineHeight.value,
            left: `${positionY.value}%`,
            transform: [
                { translateX: -35 },
                { translateY: -lineHeight.value / 2 }
            ],
        };
    });

    const rightLineStyle = useAnimatedStyle(() => {
        return {
            width: lineWidth.value,
            height: lineHeight.value,
            right: `${positionY.value}%`,
            transform: [
                { translateX: 35 },
                { translateY: -lineHeight.value / 2 }
            ],
        };
    });

    const animBoxStyle = useAnimatedStyle(() => {
        return {
            height: animBoxHeight.value,
        };
    });

    const containerStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        // Wait for authentication check to complete before starting animation
        const timer = setTimeout(() => {
            handleAnimation();
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    const handleAnimation = () => {
        if (isAuthenticated && welcome_enabled) {
            dispatch(setShowWelcome(true));
        }

        // Phase 1: Logo height collapse with smooth easing
        animBoxHeight.value = withDelay(200, withTiming(0, {
            duration: 600,
            easing: Easing.out(Easing.cubic)
        }));

        // Phase 1: Lines grow vertically with slight delay for smoother effect
        lineHeight.value = withDelay(100, withTiming(windowHeight, {
            duration: 500,
            easing: Easing.out(Easing.quad)
        }));

        // Phase 2: Lines expand horizontally and move outward
        lineWidth.value = withDelay(700, withTiming(20, {
            duration: 400,
            easing: Easing.out(Easing.quad)
        }));

        positionY.value = withDelay(700, withTiming(-15, {
            duration: 700,
            easing: Easing.out(Easing.cubic)
        }));

        // Phase 3: Fade out with smooth transition
        opacity.value = withDelay(700, withTiming(0, {
            duration: 500,
            easing: Easing.inOut(Easing.quad)
        }));

        // // Final cleanup with proper timing
        setTimeout(() => {
            dispatch(hideSplash());
            // Only show purchase component for non-authenticated users
            if (!isAuthenticated) {
                dispatch(setShowPurchase(true));
            }
            if (isAuthenticated && mode === 'preview') {
                console.log('show extend subscription');
                dispatch(setShowExtendSubscription(true));
            }
        }, 1200);
    }

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={styles.logoBox}>
                <Animated.View style={[styles.logoAnimBox, animBoxStyle]}>
                    <Image source={LOGO} style={IMAGE_STYLE} resizeMode="contain" />
                </Animated.View>
            </View>
            <Animated.View style={[styles.line, leftLineStyle]} />
            <Animated.View style={[styles.line, rightLineStyle]} />
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        backgroundColor: '#05080F',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    logoBox: {
        width: 140,
        height: 140,
        backgroundColor: '#000000',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoAnimBox: {
        width: 140,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    line: {
        backgroundColor: '#ffffff',
        position: 'absolute',
        top: '50%',
    },
});