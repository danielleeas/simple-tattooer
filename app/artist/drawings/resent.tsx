import { View, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { formatDate, formatDbDate } from "@/lib/utils";
import { useAuth } from "@/lib/contexts";
import { getRecentDepositPaidProjects } from "@/lib/services/drawing-service";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

export default function ResentDrawings() {
	const { artist } = useAuth();
	const [loading, setLoading] = useState<boolean>(true);
	const [items, setItems] = useState<Array<{ id: string; name: string; date: Date }>>([]);

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/artist/menu');
    };

	const handleUploadDrawing = (id: string) => {
		router.push(`/artist/drawings/upload?id=${id}`);
    }

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
				const rows = await getRecentDepositPaidProjects(artist.id, 60);
				if (active) setItems(rows);
			} finally {
				if (active) setLoading(false);
			}
		}
		load();
		return () => { active = false; };
	}, [artist?.id]);

	// Group by month (YYYY-MM) and sort month groups desc
	const monthGroups = (() => {
		const groups: Record<string, { title: string; key: string; items: typeof items }> = {};
		for (const it of items) {
			const y = it.date.getFullYear();
			const m = it.date.getMonth(); // 0..11
			const key = `${y}-${String(m + 1).padStart(2, '0')}`;
			if (!groups[key]) {
				const title = it.date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
				groups[key] = { title, key, items: [] };
			}
			groups[key].items.push(it);
		}
		return Object.values(groups).sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
	})();

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
                                    <View className="items-center justify-center h-[120px]">
                                        <Image
                                            source={require('@/assets/images/icons/love_thin.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">recent</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Clients</Text>
                                    </View>

									{loading ? (
										<View className="flex-1 items-center justify-center">
											<Text>Loading...</Text>
										</View>
									) : monthGroups.length === 0 ? (
										<View className="flex-1 items-center justify-center">
											<Text>No recent clients found</Text>
										</View>
									) : (
										<View className="gap-6">
											{monthGroups.map((grp, idx) => (
												<View key={grp.key} className="gap-4">
													<Text className="text-text-secondary">{grp.title}</Text>
													{grp.items.map((drawing) => (
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
													{idx < monthGroups.length - 1 && (
														<View className="h-[1px] bg-border mt-2" />
													)}
												</View>
											))}
										</View>
									)}
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
