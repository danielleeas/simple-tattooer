import { View, Image, Pressable, Linking, Animated } from "react-native";
import { useEffect, useMemo, useState, useRef } from "react";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from "expo-router";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, useToast } from "@/lib/contexts";
import { getClientById, updateClient } from "@/lib/services/clients-service";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import PHONE_IMAGE from "@/assets/images/icons/phone.png";
import { Input } from "@/components/ui/input";
import { sendClientPortalEmailOld } from "@/lib/services/booking-service";
import { Artist } from "@/lib/redux/types";

export default function ClientContact() {

    const { toast } = useToast();
    const { artist } = useAuth();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [client, setClient] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const saveBarAnim = useRef(new Animated.Value(0)).current;
    const [formData, setFormData] = useState<any>({
        name: '',
        email: '',
        phone_number: '',
        location: '',
        notes: '',
    });

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

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name,
                email: client.email,
                phone_number: client.phone_number,
                location: client.location,
                notes: client.links[0].notes || '',
            });
        }
    }, [client]);

    const hasChanges = useMemo(() => {
        if (!client) return false;
        if (!formData) return false;
        if (formData.name !== client.name) return true;
        if (formData.email !== client.email) return true;
        if (formData.phone_number !== client.phone_number) return true;
        if (formData.location !== client.location) return true;
        if (formData.notes !== (client.links[0]?.notes || '')) return true;
        return false;
    }, [formData, client]);

    useEffect(() => {
        Animated.timing(saveBarAnim, {
            toValue: hasChanges ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [hasChanges, saveBarAnim]);

    const saveBarTranslateY = saveBarAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [80, 0],
    });

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
        void sendClientPortalEmailOld({
            artist: artist as Artist,
            clientId: client.id,
            clientname: formData.name,
            clientEmail: formData.email,
        });

        toast({
            variant: 'success',
            title: 'Dashboard link sent!',
            description: 'We have sent your client link again.',
            duration: 3000,
        });
    }

    const handleCall = async (phone_number: string) => {
        const url = `tel:${phone_number}`;
        if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url);
        } else {
            toast({
                variant: 'error',
                title: 'Cannot open phone app',
            });
        }
    }

    const handleMessage = async (phone_number: string) => {
        const url = `sms:${phone_number}`;
        if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url);
        } else {
            toast({
                variant: 'error',
                title: 'Cannot open message app',
            });
        }
    }

    const handleSave = async () => {
        if (!artist?.id || !client?.id) return;
        
        setSaving(true);
        try {
            const success = await updateClient(artist.id, client.id, formData);
            if (success) {
                // Reload client data to reflect changes
                const updatedClient = await getClientById(artist.id, client.id);
                if (updatedClient) {
                    setClient(updatedClient);
                }
                toast({ 
                    variant: 'success', 
                    title: 'Changes saved',
                    description: 'Client information has been updated successfully.',
                });
            } else {
                toast({ 
                    variant: 'error', 
                    title: 'Failed to save changes',
                    description: 'Please try again later.',
                });
            }
        } catch (error) {
            console.error('Error saving client:', error);
            toast({ 
                variant: 'error', 
                title: 'Failed to save changes',
                description: 'An unexpected error occurred.',
            });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
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
                <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
                <SafeAreaView className='flex-1 bg-background'>
                    <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                    <View className="flex-1 justify-center items-center px-4">
                        <Text variant="h4" className="text-center">Client not found</Text>
                    </View>
                </SafeAreaView>
            </>
        );
    }

    console.log(client)

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
                                            <Input
                                                spellCheck={false}
                                                autoComplete="off"
                                                textContentType="none"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                value={formData.name}
                                                onChangeText={(text) => setFormData({ ...formData, name: text })} />
                                        </View>

                                        <View className="gap-2">
                                            <Text className="text-text-secondary">Email</Text>
                                            <Input
                                                spellCheck={false}
                                                autoComplete="off"
                                                textContentType="none"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                value={formData.email}
                                                onChangeText={(text) => setFormData({ ...formData, email: text })} />
                                        </View>

                                        <View className="gap-2">
                                            <Text className="text-text-secondary">Phone Number</Text>
                                            <Input
                                                spellCheck={false}
                                                autoComplete="off"
                                                textContentType="none"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                value={formData.phone_number}
                                                onChangeText={(text) => setFormData({ ...formData, phone_number: text })} />
                                            <View className="flex-row items-center gap-4">
                                                <Pressable className="flex-row items-center gap-1" onPress={() => handleCall(formData.phone_number)}>
                                                    <Image source={require('@/assets/images/icons/phone_thick.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                                                    <Text variant="h5">Call</Text>
                                                </Pressable>
                                                <Pressable className="flex-row items-center gap-1" onPress={() => handleMessage(formData.phone_number)}>
                                                    <Image source={require('@/assets/images/icons/chat.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                                    <Text variant="h5">Message</Text>
                                                </Pressable>
                                            </View>
                                        </View>

                                        <View className="gap-2">
                                            <Text className="text-text-secondary">City/Country</Text>
                                            <Input
                                                spellCheck={false}
                                                autoComplete="off"
                                                textContentType="none"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                value={formData.location}
                                                onChangeText={(text) => setFormData({ ...formData, location: text })} />
                                        </View>

                                        <View className="gap-2">
                                            <Text className="text-text-secondary">Notes</Text>
                                            <Textarea
                                                placeholder="Enter notes"
                                                className="min-h-28"
                                                spellCheck={false}
                                                autoComplete="off"
                                                textContentType="none"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                value={formData.notes}
                                                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                                            />
                                        </View>

                                        <View className="gap-1 items-center justify-center">
                                            <Button variant="outline" size="lg" className="w-full" disabled={client.links[0].is_new} onPress={handleResendDashboardLink}>
                                                <Text variant='h5'>Resend Dashboard Link</Text>
                                            </Button>
                                            <Text className="text-text-secondary" numberOfLines={1} ellipsizeMode="tail" minimumFontScale={0.8}>Send this client their dashboard access link again.</Text>
                                            <Text className="text-text-secondary leading-none" numberOfLines={1} ellipsizeMode="tail" minimumFontScale={0.8}>Great if they lost the original email.</Text>
                                        </View>
                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                        <Animated.View
                            pointerEvents={hasChanges ? 'auto' : 'none'}
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                transform: [{ translateY: saveBarTranslateY }],
                                opacity: saveBarAnim,
                            }}
                        >
                            <View className="px-4 py-4 bg-background">
                                <Button
                                    variant="outline"
                                    onPress={handleSave}
                                    disabled={saving || !hasChanges}
                                    className="w-full"
                                >
                                    <Text className="text-white font-semibold">
                                        {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
                                    </Text>
                                </Button>
                            </View>
                        </Animated.View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
