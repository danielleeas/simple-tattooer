import { useState, useEffect, useRef } from "react";
import { View, Image, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";
import { ChevronRightIcon, SearchIcon, XIcon, PlusIcon } from "lucide-react-native";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

export default function AllClients() {
    const [localSearchQuery, setLocalSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchInputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (localSearchQuery.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeoutId = setTimeout(async () => {
            try {
                const result: any[] = [];
                setSearchResults(result as any);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [localSearchQuery]);

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/preview/menu');
    };

    const handleAddClient = () => {
        router.push('/preview/clients/add');
    };

    const handleSearchChange = (text: string) => {
        setLocalSearchQuery(text);
        if (text.length >= 2) {
            setShowResults(true);
        } else {
            setShowResults(false);
        }
    };

    const handleClearSearch = () => {
        setLocalSearchQuery("");
        setSearchResults([]);
        setIsSearching(false);
        setShowResults(false);
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
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
                    <View className="flex-1 bg-background px-4 py-2 pb-8 gap-6">
                    <View className="items-center justify-center pb-9">
                            <Image
                                source={require('@/assets/images/icons/love_thin.png')}
                                style={{ width: 56, height: 56 }}
                                resizeMode="contain"
                            />
                            <Text variant="h6" className="text-center uppercase">See All Clients</Text>
                        </View>
                        <View className="gap-1">
                            <View className="relative z-20">
                                <View className="flex-row items-center rounded-lg bg-background-secondary border border-border pl-3 h-10">
                                    <Icon as={SearchIcon} size={16} className="text-text-secondary mr-3" />
                                    <TextInput
                                        ref={searchInputRef}
                                        placeholder="Search"
                                        placeholderTextColor="#9CA3AF"
                                        value={localSearchQuery}
                                        onChangeText={handleSearchChange}
                                        onFocus={() => {
                                            if (localSearchQuery.length >= 2) setShowResults(true);
                                        }}
                                        className="flex-1 text-foreground text-small"
                                    />
                                    {localSearchQuery.length > 0 && (
                                        <Pressable
                                            onPress={handleClearSearch}
                                            className="p-2"
                                        >
                                            <Icon as={XIcon} size={16} className="text-text-secondary" />
                                        </Pressable>
                                    )}
                                </View>
                                {/* Search Results - exactly like location modal */}
                                {showResults && localSearchQuery.length >= 2 && (
                                    <View className="z-10 absolute w-full top-11 bg-background rounded-lg border border-border p-1 gap-1">
                                        {isSearching ? (
                                            <View className="rounded-lg bg-background-secondary flex-row items-center justify-center px-4 py-3">
                                                <Text variant="small" className="text-text-secondary">Searching...</Text>
                                            </View>
                                        ) : searchResults.length > 0 ? (
                                            <></>
                                        ) : (
                                            <View className="rounded-lg bg-background-secondary flex-row items-center justify-center px-4 py-3">
                                                <Text variant="small" className="text-text-secondary">No clients found</Text>
                                            </View>
                                        )}
                                        {/* Add New Client Button */}
                                        <Pressable
                                            onPress={() => {
                                                setShowResults(false);
                                                handleAddClient();
                                            }}
                                            className="rounded-lg bg-background-secondary flex-row items-center justify-between h-9 px-4 py-2"
                                        >
                                            <View className="flex-row items-center gap-3 flex-1">
                                                <Icon as={PlusIcon} size={16} className="text-text-secondary" />
                                                <Text variant="small" className="flex-1">Add New Client</Text>
                                            </View>
                                            <Icon as={ChevronRightIcon} size={16} className="text-text-secondary" />
                                        </Pressable>
                                    </View>
                                )}
                                <Text className="text-text-secondary mt-3">Type a name top find any client, instantly.</Text>
                            </View>
                        </View>
                        {showResults && (
                            <Pressable
                                onPress={() => {
                                    searchInputRef.current?.blur();
                                    setShowResults(false);
                                }}
                                className="absolute inset-0 z-10"
                            />
                        )}
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6">
                                    <View className="items-center justify-center px-4 py-3">
                                        <Text variant="h5" className="text-text-secondary">No clients found</Text>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}