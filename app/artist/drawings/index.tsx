import { View, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { formatDate, formatDbDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts";
import { getRecentDepositPaidProjects } from "@/lib/services/drawing-service";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

export default function Drawings() {
    const { artist } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [items, setItems] = useState<Array<{ id: string; name: string; date: Date }>>([]);

    useEffect(() => {
        let active = true;
        async function load() {
            if (!artist?.id) {
                if (active) {
                    setItems([]);
                    setLoading(false);
                }
                return;
            }
            setLoading(true);
            try {
                const rows = await getRecentDepositPaidProjects(artist.id, 20);
                if (active) setItems(rows);
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => { active = false; };
    }, [artist?.id]);

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    const handleResentDrawings = () => {
        router.push('/artist/drawings/resent');
    }

    const handleUploadDrawing = (id: string) => {
        router.push(`/artist/drawings/upload?id=${id}`);
    }

    return (
        <>
            <Stack.Screen options={{headerShown: false, animation: 'slide_from_right'}} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={HOME_IMAGE}
                    leftButtonTitle="Home"
                    onLeftButtonPress={handleHome}
                    rightButtonImage={MENU_IMAGE}
                    rightButtonTitle="Menu"
                    onRightButtonPress={handleMenu}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6 pb-6">
                                    <View className="items-center justify-center pb-[22px] h-[180px]">
                                        <Image
                                            source={require('@/assets/images/icons/drawing.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">To-Draw List</Text>
                                        <Text className="text-center mt-2 text-text-secondary">The system keeps track of who needs a</Text>
                                        <Text className="text-center text-text-secondary leading-none">design-upload when you're ready</Text>
                                    </View>

                                    <View className="gap-6">
                                        {loading ? (
                                            <View className="flex-1 items-center justify-center">
                                                <Text>Loading...</Text>
                                            </View>
                                        ) : items.length === 0 ? (
                                            <View className="flex-1 items-center justify-center">
                                                <Text>No drawings found</Text>
                                            </View>
                                        ) : (
                                            <View className="gap-6">
                                                {items.map((drawing) => (
                                                    <View key={drawing.id} className="flex-row gap-2">
                                                        <View className="flex-1 justify-between">
                                                            <Text variant="h4">{drawing.name}</Text>
                                                            <Text className="text-text-secondary">{formatDbDate(drawing.date)}</Text>
                                                        </View>
                                                        <Pressable onPress={() => handleUploadDrawing(drawing.id)}>
                                                            <Image
                                                                source={require('@/assets/images/icons/upload_photo.png')}
                                                                style={{ width: 56, height: 56 }}
                                                                resizeMode="contain"
                                                            />
                                                        </Pressable>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                        <View>
                            <Button variant="outline" size="lg" onPress={handleResentDrawings}>
                                <Text>Show Recent Clients</Text>
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
