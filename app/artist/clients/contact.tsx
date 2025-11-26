import { View, Image, Pressable, Linking } from "react-native";
import { useEffect, useState } from "react";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, useToast } from "@/lib/contexts";
import { getClientById } from "@/lib/services/clients-service";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import PHONE_IMAGE from "@/assets/images/icons/phone.png";
import { Input } from "@/components/ui/input";

export default function ClientContact() {

    const { toast } = useToast();
    const { artist } = useAuth();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [client, setClient] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        async function load() {
            if (!artist?.id || !id) {
                if (isMounted) {
                    setClient(null);
                    setLoading(false);
                }
                return;
            }
            setLoading(true);
            try {
                const result = await getClientById(artist.id, String(id));
                if (isMounted) {
                    setClient(result);
                }
            } catch {
                if (isMounted) setClient(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        load();
        return () => { isMounted = false; };
    }, [artist?.id, id]);

    const handleBack = () => {
        router.back();
    };

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    const handleHome = () => {
        router.dismissAll();
    };

    const handleResendDashboardLink = () => {
        toast({
            variant: 'success',
            title: 'Dashboard link sent!',
            description: 'We have sent your client link again.',
            duration: 3000,
        });
        router.back();
    }

    const handleCall = async () => {
        const url = `tel:${client.phone_number}`;
        if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url);
        } else {
            toast({
                variant: 'error',
                title: 'Cannot open phone app',
            });
        }
    }

    const handleMessage = async () => {
        const url = `sms:${client.phone_number}`;
        if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url);
        } else {
            toast({
                variant: 'error',
                title: 'Cannot open message app',
            });
        }
    }

    if (loading) {
        return (
            <>
                <Stack.Screen options={{headerShown: false, animation: 'slide_from_right'}} />
                <SafeAreaView className='flex-1 bg-background'>
                    <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                    <View className="flex-1 justify-center items-center px-4">
                        <Text variant="h4" className="text-center">Loading...</Text>
                    </View>
                </SafeAreaView>
            </>
        );
    }

    if (!client) {
        return (
            <>
                <Stack.Screen options={{headerShown: false, animation: 'slide_from_right'}} />
                <SafeAreaView className='flex-1 bg-background'>
                    <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                    <View className="flex-1 justify-center items-center px-4">
                        <Text variant="h4" className="text-center">Client not found</Text>
                    </View>
                </SafeAreaView>
            </>
        );
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
                    <View className="flex-1 bg-background px-4 py-2 pb-8 gap-6">
                        <View className="flex-1">
                            <KeyboardAwareScrollView bottomOffset={80} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6 pb-6">
                                    <View className="items-center justify-center pb-[22px] h-[180px]">
                                        <Image
                                            source={PHONE_IMAGE}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Contact</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">info</Text>
                                        <Text className="text-center mt-2 text-text-secondary max-w-80">Get in touch with the client easily</Text>
                                    </View>

                                    <View className="gap-6">
                                        <View className="gap-2">
                                            <Text className="text-text-secondary">Name</Text>
                                            <Input value={client.name} />
                                        </View>

                                        <View className="gap-2">
                                            <Text className="text-text-secondary">Email</Text>
                                            <Input value={client.email} />
                                        </View>

                                        <View className="gap-2">
                                            <Text className="text-text-secondary">Phone Number</Text>
                                            <Input value={client.phone_number} />
                                            <View className="flex-row items-center gap-4">
                                                <Pressable className="flex-row items-center gap-1" onPress={handleCall}>
                                                    <Image source={require('@/assets/images/icons/phone_thick.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                                                    <Text variant="h5">Call</Text>
                                                </Pressable>
                                                <Pressable className="flex-row items-center gap-1" onPress={handleMessage}>
                                                    <Image source={require('@/assets/images/icons/chat.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                                    <Text variant="h5">Message</Text>
                                                </Pressable>
                                            </View>
                                        </View>

                                        <View className="gap-2">
                                            <Text className="text-text-secondary">City/Country</Text>
                                            <Input value={client.location} />
                                        </View>

                                        <View className="gap-2">
                                            <Text className="text-text-secondary">Notes</Text>
                                            <Textarea
                                                placeholder="Enter notes"
                                                className="min-h-28"
                                                value={client.project_notes || ''}
                                            />
                                        </View>

                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>

                        <View className="gap-1 items-center justify-center">
                            <Button variant="outline" size="lg" className="w-full" disabled={client.status !== 'deposit_paid'} onPress={handleResendDashboardLink}>
                                <Text variant='h5'>Resend Dashboard Link</Text>
                            </Button>
                            <Text className="text-text-secondary" numberOfLines={1} ellipsizeMode="tail" minimumFontScale={0.8}>Send this client their dashboard access link again.</Text>
                            <Text className="text-text-secondary leading-none" numberOfLines={1} ellipsizeMode="tail" minimumFontScale={0.8}>Great if they lost the original email.</Text>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
