import { useEffect, useState } from "react";
import { View, Image } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated";
import { setShowWelcome } from "@/lib/redux/slices/ui-slice";
import { useAppDispatch } from "@/lib/redux/hooks";
import { useAuth } from "@/lib/contexts/auth-context";

export default function Welcome() {
    const dispatch = useAppDispatch();
    const { artist } = useAuth();
    const opacity = useSharedValue<number>(1);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const imageOpacity = useSharedValue<number>(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            // Start fade out animation
            opacity.value = withTiming(0, { duration: 500 });
            
            // Hide welcome screen after fade out completes
            setTimeout(() => {
                dispatch(setShowWelcome(false));
            }, 500);
        }, 3000);
        
        return () => {
            clearTimeout(timer);
        };
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    const imageAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: imageOpacity.value,
        };
    });

    const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
        imageOpacity.value = withTiming(1, { duration: 300 });
    };

    const handleImageError = () => {
        setImageLoading(false);
        setImageError(true);
        imageOpacity.value = withTiming(1, { duration: 300 });
    };

    return (
        <Animated.View 
            style={[animatedStyle]}
            className="z-20 absolute left-0 right-0 top-0 bottom-0 flex-1 bg-background pt-4 pb-4 gap-6"
        >
            <View className="items-center justify-center px-4">
                <Text variant="h2" className="text-center">{artist?.full_name}</Text>
                <Text variant="h5">{artist?.social_handler ? `${artist?.social_handler}` : '@artist.instagram'}</Text>
            </View>
            <View className="flex-1 relative">
                {/* Loading placeholder */}
                {imageLoading && artist?.photo && (
                    <View className="absolute inset-0 bg-background-secondary items-center justify-center">
                        <Text className="text-text-secondary">Loading...</Text>
                    </View>
                )}
                
                {/* Main image */}
                <Animated.View style={[imageAnimatedStyle, { width: '100%', height: '100%' }]}>
                    <Image
                        source={
                            artist?.photo && !imageError 
                                ? { uri: artist.photo } 
                                : require('@/assets/images/others/client_welcome.png')
                        }
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                </Animated.View>
            </View>
            <View className="items-end justify-center px-4">
                <Text variant="h3">Simple Tattooer.</Text>
                <Text className="text-xs">Helping tattoo artists just tattoo again. </Text>
            </View>
        </Animated.View>
    );
}
