import { useEffect } from "react";
import { router } from "expo-router";
import { Pressable, View, StyleSheet, useWindowDimensions, ImageStyle, Image } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Settings2, X } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setShowExtendSubscription } from "@/lib/redux/slices/ui-slice";

import Info from '@/assets/images/icons/warning_circle.png';

const ICON_STYLE: ImageStyle = {
    height: 80,
    width: 80,
};

export default function ExtenSubModal() {
    const dispatch = useAppDispatch();
    const showExtendSubscription = useAppSelector((state) => state.ui.showExtendSubscription);
    const { height: windowHeight, width: windowWidth } = useWindowDimensions();
    const height = useSharedValue<number>(50);
    const width = useSharedValue<number>(50);
    const viewHeight = useSharedValue<number>(0);

    const extendContainerStyle = useAnimatedStyle(() => {
        return {
            height: height.value,
            width: width.value,
        };
    });

    const extendViewStyle = useAnimatedStyle(() => {
        return {
            height: viewHeight.value,
        };
    });

    const handleExtendButton = () => {
        dispatch(setShowExtendSubscription(true));
    }

    const handleCloseExtend = () => {
        viewHeight.value = withSpring(0, {
            duration: 300,
        });

        setTimeout(() => {
            height.value = withSpring(50, {
                duration: 300,
            });

            width.value = withSpring(50, {
                duration: 300,
            });

        }, 400);

        setTimeout(() => {
            dispatch(setShowExtendSubscription(false));
        }, 700);
    }

    // Trigger animations when showExtendSubscription changes
    useEffect(() => {
        if (showExtendSubscription) {
            width.value = withSpring(windowWidth, {
                duration: 300,
            });

            height.value = withSpring(windowHeight, {
                duration: 300,
            });

            setTimeout(() => {
                viewHeight.value = withSpring(300, {
                    duration: 300,
                });
            }, 400);
        }
    }, [showExtendSubscription, windowWidth, windowHeight]);

    const handleExtendPage = () => {
        // router.push('/subscribe?type=extend');
        handleCloseExtend();
    }

    return (
        <>
            {!showExtendSubscription && (
                <View style={styles.container}>
                    <Pressable onPress={handleExtendButton}>
                        <Icon as={Settings2} size={24} />
                    </Pressable>
                </View>
            )}
            {showExtendSubscription && (
                <Animated.View style={[styles.extendContainer, extendContainerStyle]}>
                    <Pressable style={styles.backDrop} onPress={handleCloseExtend} />

                    <View style={styles.container}>
                        <Pressable onPress={handleCloseExtend}>
                            <Icon as={X} size={24} />
                        </Pressable>
                    </View>

                    <Animated.View style={[styles.extendView, extendViewStyle]} className="w-full bg-background-secondary">
                        <Pressable onPress={handleCloseExtend} className="absolute top-4 right-4">
                            <Icon as={X} size={24} />
                        </Pressable>
                        <View className="p-4 pt-8 gap-2">
                            <View className="items-center justify-center">
                                <Image
                                    source={Info}
                                    style={ICON_STYLE}
                                    resizeMode="contain"
                                />
                            </View>
                            <View>
                                <Text variant="h6" className="text-center">Your subscription has expired</Text>
                                <Text variant="h6" className="text-center leading-none">Extend it to continue using all features!</Text>
                            </View>
                            <Text className="text-center text-text-secondary">Extend to unlock full access!</Text>
                            <Button variant="outline" className="mt-4" onPress={handleExtendPage}>
                                <Text>Extend Subscription</Text>
                            </Button>
                        </View>
                    </Animated.View>
                </Animated.View>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 990,
        height: 40,
        width: 40,
        top: 10,
        right: 10,
    },
    extendContainer: {
        flex: 1,
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        zIndex: 1000,
        top: 0,
        right: 0,
    },
    backDrop: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    extendView: {
        position: 'relative',
        overflow: 'hidden',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    }
});
