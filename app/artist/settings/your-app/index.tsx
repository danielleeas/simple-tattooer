import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import Header from "@/components/lib/Header";

import { View, Image, Pressable, Modal, TouchableOpacity, ActivityIndicator, Keyboard } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, ChevronUp, Eye, EyeOff, X } from "lucide-react-native";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { THEME } from "@/lib/theme";
import * as ExpoImagePicker from 'expo-image-picker';
import { AvatarPicker } from "@/components/lib/avatar-picker";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { useToast, useAuth } from "@/lib/contexts";
import { LocationModal, LocationData } from '@/components/lib/location-modal';
import { compressImage } from "@/lib/utils";
import { checkBookingLinkAvailability } from "@/lib/services/auth-service";
import { BASE_URL } from "@/lib/constants";
import * as Clipboard from 'expo-clipboard';
import { uploadFileToStorage } from "@/lib/services/storage-service";
// import { deleteAccount, updateArtistInfo, updateArtistLocations, updateGeneralSettings, updatePassword } from '@/lib/services/settings-service';
import { fetchUpdatedArtistProfile } from "@/lib/redux/slices/auth-slice";
import { useAppDispatch } from "@/lib/redux/hooks";
import { Locations } from "@/lib/redux/types";
import CustomModal from "@/components/lib/custom-modal";
import { ensureCalendarPermissions } from "@/lib/services/device-calendar";

import { Collapse } from "@/components/lib/collapse";

import { Details } from "./details";
import { Control } from "./control";
import { BrandingDataProps } from "./type";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";

const defaultBrandingData: BrandingDataProps = {
    fullName: '',
    studioName: '',
    bookingLink: '',
    location: {
        address: '',
        placeId: '',
        coordinates: {
            latitude: 0,
            longitude: 0,
        },
        isMainStudio: false,
    },
    socialMediaHandle: '',
    profilePhoto: '',
    avatar: '',
    watermarkEnabled: false,
    watermarkImage: '',
    watermarkText: '',
    watermarkPosition: 'center',
    watermarkOpacity: 50,
    welcomeScreenEnabled: true,
};

export default function YourApp() {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { artist } = useAuth();

    const [brandingData, setBrandingData] = useState<BrandingDataProps>(defaultBrandingData);
    const [initialBrandingData, setInitialBrandingData] = useState<BrandingDataProps | null>(null);

    const mainLocation = useMemo(() => {
        if (!artist) return null;
        return Array.isArray(artist.locations)
            ? artist.locations.find((l: any) => (l.is_main_studio ?? l.isMainStudio) === true) ?? artist.locations[0]
            : undefined;
    }, [artist]);

    const createBrandingDataFromArtist = useCallback((artistData: any, ml: any): BrandingDataProps => {
        return {
            ...defaultBrandingData,
            fullName: artistData?.full_name ?? '',
            studioName: artistData?.studio_name ?? '',
            bookingLink: artistData?.booking_link ?? '',
            location: {
                id: ml?.id ?? '',
                address: ml?.address ?? '',
                placeId: ml?.place_id ?? ml?.placeId ?? '',
                coordinates: {
                    latitude: ml?.coordinates?.latitude ?? 0,
                    longitude: ml?.coordinates?.longitude ?? 0,
                },
                isMainStudio: ml?.is_main_studio ?? ml?.isMainStudio ?? false,
            },
            socialMediaHandle: artistData?.social_handler ?? '',
            profilePhoto: artistData?.photo ?? '',
            avatar: artistData?.avatar ?? '',
            watermarkEnabled: artistData?.app?.watermark_enabled ?? false,
            watermarkImage: artistData?.app?.watermark_image ?? '',
            watermarkText: artistData?.app?.watermark_text ?? '',
            watermarkPosition: artistData?.app?.watermark_position ?? 'center',
            watermarkOpacity: artistData?.app?.watermark_opacity ?? 50,
            welcomeScreenEnabled: artistData?.app?.welcome_screen_enabled ?? true,
        };
    }, []);

    useEffect(() => {
        if (artist) {
            const data = createBrandingDataFromArtist(artist, mainLocation);
            setBrandingData(data);
            setInitialBrandingData(data);
        } else {
            setBrandingData(defaultBrandingData);
            setInitialBrandingData(null);
        }
    }, [artist, mainLocation, createBrandingDataFromArtist]);

    const hasChanges = useMemo(() => {
        if (!artist || !initialBrandingData) return false;
        return (
            brandingData.fullName !== initialBrandingData.fullName ||
            brandingData.studioName !== initialBrandingData.studioName ||
            brandingData.bookingLink !== initialBrandingData.bookingLink ||
            brandingData.location?.id !== initialBrandingData.location?.id ||
            brandingData.location?.address !== initialBrandingData.location?.address ||
            brandingData.location?.placeId !== initialBrandingData.location?.placeId ||
            brandingData.location?.coordinates.latitude !== initialBrandingData.location?.coordinates.latitude ||
            brandingData.location?.coordinates.longitude !== initialBrandingData.location?.coordinates.longitude ||
            brandingData.location?.isMainStudio !== initialBrandingData.location?.isMainStudio ||
            brandingData.socialMediaHandle !== initialBrandingData.socialMediaHandle ||
            brandingData.profilePhoto !== initialBrandingData.profilePhoto ||
            brandingData.avatar !== initialBrandingData.avatar ||
            brandingData.watermarkEnabled !== initialBrandingData.watermarkEnabled ||
            brandingData.watermarkImage !== initialBrandingData.watermarkImage ||
            brandingData.watermarkText !== initialBrandingData.watermarkText ||
            brandingData.watermarkPosition !== initialBrandingData.watermarkPosition ||
            brandingData.watermarkOpacity !== initialBrandingData.watermarkOpacity ||
            brandingData.welcomeScreenEnabled !== initialBrandingData.welcomeScreenEnabled
        );
    }, [brandingData, artist, initialBrandingData]);

    console.log("hasChanges", hasChanges);

    const handleHome = () => {
        router.dismissAll();
    };

    const handleBack = () => {
        router.back();
    };

    const handleMenu = () => {
        // router.push('/production/menu');
    };

    const updateBrandingData = (updates: Partial<BrandingDataProps>) => {
        setBrandingData(prev => ({ ...prev, ...updates }));
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={HOME_IMAGE}
                    leftButtonTitle="Today"
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
                    <View className="flex-1 pt-2 gap-6">
                        <View className="flex-1">
                            <KeyboardAwareScrollView
                                contentContainerClassName="w-full"
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                bottomOffset={20}
                            >
                                <View className="flex-1 bg-background px-4 pt-2 gap-6">
                                    <View className="items-center justify-center" style={{ height: 180 }}>
                                        <Image
                                            source={require('@/assets/images/icons/your_app.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Your</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">App</Text>
                                        <Text className="text-center mt-2 text-text-secondary">Enhance the experience</Text>
                                        <Text className="text-center text-text-secondary leading-none">for you & your clients.</Text>
                                    </View>

                                    <View className="gap-6">
                                        <Collapse
                                            title="Artist Details & Branding"
                                            textClassName="text-2xl"
                                            description="Your name, studio, contact, photo, and vibe — all in one place"
                                            descriptionClassName="text-sm"
                                        >
                                            <Details brandingData={brandingData} updateBrandingData={updateBrandingData} artist={artist} />
                                        </Collapse>

                                        <Collapse
                                            title="General Controls"
                                            textClassName="text-2xl"
                                            description="Little switches for big stuff"
                                            descriptionClassName="text-sm"
                                        >
                                            <Control />
                                        </Collapse>
                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView >
        </>
    );
}