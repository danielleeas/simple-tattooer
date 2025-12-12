import React, { useEffect, useState } from 'react';
import { View, Image, Dimensions, Pressable } from 'react-native';
import { Stack, router, RelativePathString } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { RootState } from '@/lib/redux/store';
import { setArtist } from '@/lib/redux/slices/artist-slice';
import { setShowWelcome } from '@/lib/redux/slices/ui-slice';
import { useAuth } from '@/lib/contexts';
import { Artist } from '@/lib/redux/types';
import Splash from '@/components/lib/splash';
import Welcome from '@/components/lib/welcome';
import { UserCircle } from 'lucide-react-native';
import { ClientSwitcherModal } from '@/components/lib/client-switcher-modal';

const { height: screenHeight } = Dimensions.get('window');

interface ClientHomeProps {
    mode: 'preview' | 'production' | 'client';
    clientId: string;
}

export default function ClientHome({ mode, clientId }: ClientHomeProps) {
    const dispatch = useAppDispatch();
    const { client, isLoading: authLoading } = useAuth();
    const showSplash = useAppSelector((state: RootState) => state.ui as any).showSplash;
    const showWelcome = useAppSelector((state: RootState) => (state.ui as any).showWelcome);
    const selectedArtist = useAppSelector((state: RootState) => state.artist.artist);

    const [linkedArtists, setLinkedArtists] = useState<Artist[]>([]);
    const [showArtistSelection, setShowArtistSelection] = useState(false);
    const [hasShownWelcome, setHasShownWelcome] = useState(false);
    const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

    // Extract artists from client data stored in Redux
    useEffect(() => {
        if (client?.links && client.links.length > 0) {
            const artists = client.links.map((link: any) => link.artist);
            console.log('artists', artists);
            setLinkedArtists(artists);
        }
    }, [client]);

    // Handle artist selection logic
    useEffect(() => {
        console.log('linkedArtists', linkedArtists);
        console.log('selectedArtist', selectedArtist);
        console.log('authLoading', authLoading);
        console.log('client', client);
        if (authLoading || !client) return;

        if (linkedArtists.length === 1) {
            // Auto-select single artist
            dispatch(setArtist(linkedArtists[0]));
        } else if (linkedArtists.length > 1) {
            // Show artist selection
            setShowArtistSelection(true);
        }
        // If 0 artists, ignore (existing handlers will handle this)
    }, [linkedArtists, selectedArtist, authLoading, client, dispatch]);

    const handleSelectArtist = (artist: Artist) => {
        dispatch(setArtist(artist));
        setShowArtistSelection(false);
        setHasShownWelcome(false); // Reset when selecting a new artist
        // Show welcome screen if artist has a photo
        if (artist?.photo) {
            dispatch(setShowWelcome(true));
            setHasShownWelcome(true);
        }
    };

    // Show welcome screen when artist is auto-selected (single artist case)
    // Only show after splash is done and welcome hasn't been shown yet for this artist
    useEffect(() => {
        if (!showSplash && selectedArtist?.photo && !showArtistSelection && !hasShownWelcome) {
            dispatch(setShowWelcome(true));
            setHasShownWelcome(true);
        }
    }, [selectedArtist, showArtistSelection, showSplash, hasShownWelcome, dispatch]);

    const handleMenu = () => {
        console.log('Menu');
    };

    const handleAccountSwitcher = () => {
        setShowAccountSwitcher(true);
    };

    // Show loading while auth is loading
    if (authLoading || !client) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
                <SafeAreaView className="flex-1 bg-background">
                    <View className="flex-1 items-center justify-center bg-background">
                        <Text>Loading...</Text>
                    </View>
                </SafeAreaView>
            </>
        );
    }

    return (
        <>
            <StableGestureWrapper
                onSwipeLeft={handleMenu}
                threshold={100}
                enabled={!!selectedArtist}
            >
                <View className='flex-1 relative overflow-hidden'>
                    {showSplash && <Splash isAuthenticated={true} welcome_enabled={false} mode={mode} />}

                    {/* Show welcome screen after artist selection */}
                    {!showSplash && selectedArtist && showWelcome && (
                        <Welcome artist={selectedArtist} />
                    )}

                    {/* Only show content after splash animation completes */}
                    {!showSplash && (
                        <>
                            {/* Show artist selection if needed */}
                            {showArtistSelection && linkedArtists.length > 1 && !selectedArtist ? (
                                <View
                                    className="flex-1 justify-center gap-6 bg-background px-4"
                                    style={{ paddingVertical: screenHeight * 0.08 }}>
                                    <View className="flex-1 justify-center">
                                        <View className="items-center mb-8">
                                            <Text variant="h1" className="text-center">
                                                Select Your Artist
                                            </Text>
                                            <Text variant="default" className="text-center text-muted-foreground mt-2">
                                                Choose which artist you'd like to work with
                                            </Text>
                                        </View>

                                        <View className="gap-4">
                                            {linkedArtists.map((artist) => (
                                                <Pressable
                                                    key={artist.id}
                                                    onPress={() => handleSelectArtist(artist)}
                                                    className="bg-card rounded-lg p-4 border border-border active:bg-muted">
                                                    <View className="flex-row items-center gap-4">
                                                        <Avatar className="h-16 w-16" alt={artist.full_name}>
                                                            <AvatarImage source={{ uri: artist.avatar || artist.photo }} />
                                                            <AvatarFallback>
                                                                <Text variant="h4">{artist.full_name.charAt(0).toUpperCase()}</Text>
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <View className="flex-1">
                                                            <Text variant="h4" className="font-semibold">
                                                                {artist.full_name}
                                                            </Text>
                                                            {artist.studio_name && (
                                                                <Text variant="default" className="text-muted-foreground">
                                                                    {artist.studio_name}
                                                                </Text>
                                                            )}
                                                        </View>

                                                        <View className="ml-2">
                                                            <Text variant="default" className="text-muted-foreground">
                                                                ›
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            ) : selectedArtist && !showWelcome ? (
                                // Show dashboard if artist is selected and welcome screen is not showing
                                <View
                                    className="flex-1 justify-center gap-6 bg-background px-4"
                                    style={{ paddingVertical: screenHeight * 0.08 }}>

                                    <Pressable
                                        onPress={handleAccountSwitcher}
                                        className="absolute top-4 right-4 z-10"
                                        style={{ width: 44, height: 44 }}
                                    >
                                        <View className="w-11 h-11 rounded-full bg-border border-2 border-primary items-center justify-center">
                                            <UserCircle size={28} color="#888" />
                                        </View>
                                    </Pressable>
                                    <View className="flex-1 justify-around">
                                        <View className="w-full flex-row items-center justify-center">
                                            <View className="h-full items-center">
                                                <Pressable className="items-center justify-end" onPress={() => router.push('/client/message' as RelativePathString)}>
                                                    <Image
                                                        source={require('@/assets/images/icons/message.png')}
                                                        style={{ width: 56, height: 56 }}
                                                    />
                                                    <Text variant="h6" className="uppercase">
                                                        Messages
                                                    </Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                        <View className="w-full flex-row items-center justify-between">
                                            <View className="h-full w-[140px] items-center">
                                                <Pressable className="items-center justify-end" onPress={() => router.push('/client/payment-info' as RelativePathString)}>
                                                    <Image
                                                        source={require('@/assets/images/icons/money_bag.png')}
                                                        style={{ width: 56, height: 56 }}
                                                    />
                                                    <Text variant="h6" className="uppercase">
                                                        Payment
                                                    </Text>
                                                    <Text variant="h6" className="uppercase leading-none">
                                                        Info
                                                    </Text>
                                                </Pressable>
                                            </View>
                                            <View className="h-full w-[140px] items-center">
                                                <Pressable className="items-center justify-end" onPress={() => router.push('/client/dates' as RelativePathString)}>
                                                    <Image
                                                        source={require('@/assets/images/icons/calendar.png')}
                                                        style={{ width: 56, height: 56 }}
                                                    />
                                                    <Text variant="h6" className="uppercase">
                                                        Your
                                                    </Text>
                                                    <Text variant="h6" className="uppercase leading-none">
                                                        Dates
                                                    </Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                        <View className="gw-full items-center justify-between">
                                            <Text variant="h1" className="">
                                                Start Here.
                                            </Text>
                                            <Text variant="h1" className="leading-none">
                                                Stress Less.
                                            </Text>
                                        </View>
                                        <View className="gap-4">
                                            <View className="w-full flex-row items-center justify-between">
                                                <View className="h-full w-[140px] items-center">
                                                    <Pressable className="items-center justify-end" onPress={() => router.push('/client/flash-portfolio/' as RelativePathString)}>
                                                        <Image
                                                            source={require('@/assets/images/icons/portfolio.png')}
                                                            style={{ width: 56, height: 56 }}
                                                        />
                                                        <Text variant="h6" className="uppercase">
                                                            flash/
                                                        </Text>
                                                        <Text variant="h6" className="uppercase leading-none">
                                                            portfolio
                                                        </Text>
                                                    </Pressable>
                                                </View>
                                                <View className="h-full w-[140px] items-center">
                                                    <Pressable className="items-center justify-end" onPress={() => router.push('/client/findme' as RelativePathString)}>
                                                        <Image
                                                            source={require('@/assets/images/icons/how_to_find.png')}
                                                            style={{ width: 56, height: 56 }}
                                                        />
                                                        <Text variant="h6" className="uppercase">
                                                            How to
                                                        </Text>
                                                        <Text variant="h6" className="uppercase leading-none">
                                                            find me
                                                        </Text>
                                                    </Pressable>
                                                </View>
                                            </View>
                                            <View className="w-full flex-row items-center justify-center">
                                                <View className="h-full items-center">
                                                    <Pressable className="items-center justify-end" onPress={() => router.push('/client/faq-aftercare' as any)}>
                                                        <Image
                                                            source={require('@/assets/images/icons/question.png')}
                                                            style={{ width: 56, height: 56 }}
                                                        />
                                                        <Text variant="h6" className="uppercase">
                                                            Faqs/
                                                        </Text>
                                                        <Text variant="h6" className="uppercase leading-none">
                                                            aftercare
                                                        </Text>
                                                    </Pressable>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ) : null}
                        </>
                    )}

                    <ClientSwitcherModal
                        visible={showAccountSwitcher}
                        onClose={() => setShowAccountSwitcher(false)}
                    />
                </View>
            </StableGestureWrapper>
        </>
    );
}