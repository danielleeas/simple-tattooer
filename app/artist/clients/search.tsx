import { useState, useEffect, useRef, useCallback } from "react";
import { View, ScrollView, Pressable, TextInput, Image, type ImageStyle } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";
import { ChevronRightIcon, SearchIcon, XIcon, PlusIcon } from "lucide-react-native";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/contexts/auth-context";
import { getRecentClients, searchClients } from "@/lib/services/clients-service";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import SKELETON_IMAGE from "@/assets/images/icons/skeleton.png";
import CURRENCY_DOLLAR_IMAGE from "@/assets/images/icons/currency_dollar.png";
import WARNING_IMAGE from "@/assets/images/icons/warning_circle.png";

const BUTTON_ICON_STYLE: ImageStyle = {
    height: 24,
    width: 24,
}

export default function SearchClients() {
    const [localSearchQuery, setLocalSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [recentClients, setRecentClients] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const { artist } = useAuth();

    useEffect(() => {
        if (localSearchQuery.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeoutId = setTimeout(async () => {
            try {
				if (!artist?.id) {
					setSearchResults([]);
					return;
				}

				const results = await searchClients(artist.id, localSearchQuery, 10);
				setSearchResults(results as any);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
	}, [localSearchQuery, artist?.id]);

    const loadRecentClients = useCallback(async () => {
        if (!artist?.id) return;
        try {
            setLoadingRecent(true);
            const result = await getRecentClients(artist.id);
            setRecentClients(result as any);
        } catch (e) {
            setRecentClients([] as any);
        } finally {
            setLoadingRecent(false);
        }
    }, [artist?.id]);

    useEffect(() => {
        loadRecentClients();
    }, [loadRecentClients]);

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissTo('/');
    }

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    const handleAddClient = () => {
        router.push('/artist/clients/add');
    };

    const handleAllClients = () => {
        router.push('/artist/clients/all');
    };

    const handleClientProfile = (id?: string) => {
        if (!id) return;

        router.push({
            pathname: '/artist/clients/[id]',
            params: { id: id }
        });
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
                    <View className="flex-1 bg-background px-4 py-2 pb-6 gap-6">
                        <View>
                            <Text variant="h3" className="text-center">Search Less.</Text>
                            <Text variant="h3" className="text-center">Tattoo More</Text>
                        </View>
                        <View className="gap-1">
                            <View className="relative z-20">
                                <View className="flex-row items-center rounded-lg bg-background-secondary border border-border pl-3 h-10">
                                    <Icon as={SearchIcon} size={16} className="text-text-secondary mr-3" />
                                    <TextInput
                                        ref={inputRef}
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
                                    <View className="z-10 absolute w-full top-12 bg-background rounded-lg border border-border p-1 gap-1">
                                        {isSearching ? (
                                            <View className="rounded-lg bg-background-secondary flex-row items-center justify-center px-4 py-3">
                                                <Text variant="small" className="text-text-secondary">Searching...</Text>
                                            </View>
                                        ) : searchResults.length > 0 ? (
                                            <>
                                                {searchResults.map((client: any, index: number) => (
                                                    <Pressable
                                                        key={index}
                                                        onPress={() => {
                                                            handleClientProfile(client.id);
                                                            setTimeout(() => {
                                                                setShowResults(false);
                                                            }, 500);
                                                        }}
                                                        className="rounded-lg bg-background-secondary flex-row items-center justify-between px-4 py-3"
                                                    >
                                                        <View className="flex-row items-center gap-3 flex-1">
                                                            <Icon as={SearchIcon} size={16} className="text-text-secondary" />
                                                            <Text variant="small" className="flex-1">{client.name}</Text>
                                                        </View>
                                                        <View className="flex-row items-center gap-2">
                                                            <Icon as={ChevronRightIcon} size={16} className="text-text-secondary" />
                                                        </View>
                                                    </Pressable>
                                                ))}
                                            </>
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
                                            className="rounded-lg bg-background-secondary flex-row items-center justify-between px-4 py-3"
                                        >
                                            <View className="flex-row items-center gap-3 flex-1">
                                                <Icon as={PlusIcon} size={16} className="text-text-secondary" />
                                                <Text variant="small" className="flex-1">Add New Client</Text>
                                            </View>
                                            <Icon as={ChevronRightIcon} size={16} className="text-text-secondary" />
                                        </Pressable>
                                    </View>
                                )}
                                <Text className="text-text-secondary mt-3">Type name/email/ or phone number to find an Existing Client or Add New Client.</Text>
                            </View>
                        </View>
                        {showResults && (
                            <Pressable
                                onPress={() => {
                                    inputRef.current?.blur();
                                    setShowResults(false);
                                }}
                                className="absolute inset-0 z-10"
                            />
                        )}
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6 ">
                                    {loadingRecent ? (
                                        <View className="items-center justify-center px-4 py-3">
                                            <Text variant="h5" className="text-text-secondary">Loading...</Text>
                                        </View>
                                    ) : recentClients.length > 0 ? (
                                        <>
                                            {recentClients.map((client: any, index: number) => (
                                                <Pressable onPress={() => handleClientProfile(client.id)} key={index} className='items-center justify-between flex-row py-1 gap-4'>
                                                    <Text variant="h5" className='flex-1'>{client.name}</Text>
                                                    {client.status === 'pending' && <Image source={WARNING_IMAGE} style={BUTTON_ICON_STYLE} />}
                                                    {client.status === 'blacklisted' && <Image source={SKELETON_IMAGE} style={BUTTON_ICON_STYLE} />}
                                                    {client.status === 'need_deposit' && <Image source={CURRENCY_DOLLAR_IMAGE} style={BUTTON_ICON_STYLE} />}
                                                    <Icon as={ChevronRightIcon} size={24} className="text-text-secondary" />
                                                </Pressable>
                                            ))}
                                        </>
                                    ) : (
                                        <View className="items-center justify-center px-4 py-3">
                                            <Text variant="h5" className="text-text-secondary">No clients found</Text>
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                        <View className="gap-3">
                            <Button variant="outline" size="lg" className="w-full" onPress={handleAllClients}>
                                <Text variant='h5'>See All Clients</Text>
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}