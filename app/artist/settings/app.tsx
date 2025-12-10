
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { View, Image, ActivityIndicator, Keyboard, Animated } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import Header from "@/components/lib/Header";
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Input } from "@/components/ui/input";
import { THEME } from "@/lib/theme";
import { useToast, useAuth } from "@/lib/contexts";
import { setArtist } from "@/lib/redux/slices/auth-slice";
import { useAppDispatch } from "@/lib/redux/hooks";
import CustomModal from "@/components/lib/custom-modal";
import { LoadingOverlay } from "@/components/lib/loading-overlay";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Collapse } from "@/components/lib/collapse";
import { Details } from "@/components/pages/your-app/details";
import { Control } from "@/components/pages/your-app/control";
import { BrandingDataProps, ControlDataProps } from "@/components/pages/your-app/type";
import { updatePassword, deleteAccount, saveArtistSettings } from "@/lib/services/setting-service";

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

const defaultControlData: ControlDataProps = {
    pushNotifications: true,
    calendarSync: false,
    swipeNavigation: true,
    passwordModalOpen: false,
    deleteAccountModalOpen: false,
};

export default function YourApp() {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { artist } = useAuth();

    const [brandingData, setBrandingData] = useState<BrandingDataProps>(defaultBrandingData);
    const [initialBrandingData, setInitialBrandingData] = useState<BrandingDataProps | null>(null);
    const [controlData, setControlData] = useState<ControlDataProps>(defaultControlData);
    const [initialControlData, setInitialControlData] = useState<ControlDataProps | null>(null);
    
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [errors, setErrors] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string>('Starting...');
    const saveBarAnim = useRef(new Animated.Value(0)).current;

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

    const createControlDataFromArtist = useCallback((artistData: any): ControlDataProps => {
        return {
            ...defaultControlData,
            pushNotifications: artistData?.app?.push_notifications ?? true,
            calendarSync: artistData?.app?.calendar_sync ?? false,
            swipeNavigation: artistData?.app?.swipe_navigation ?? true,
        };
    }, []);

    useEffect(() => {
        if (artist) {
            const data = createBrandingDataFromArtist(artist, mainLocation);
            setBrandingData(data);
            setInitialBrandingData(data);
            const cdata = createControlDataFromArtist(artist);
            setControlData(cdata);
            setInitialControlData(cdata);
        } else {
            setBrandingData(defaultBrandingData);
            setInitialBrandingData(null);
            setControlData(defaultControlData);
            setInitialControlData(null);
        }
    }, [artist, mainLocation, createBrandingDataFromArtist, createControlDataFromArtist]);

    const hasChanges = useMemo(() => {
        if (!artist || !initialBrandingData || !initialControlData) return false;
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
            brandingData.welcomeScreenEnabled !== initialBrandingData.welcomeScreenEnabled ||
            controlData.pushNotifications !== initialControlData.pushNotifications ||
            controlData.calendarSync !== initialControlData.calendarSync ||
            controlData.swipeNavigation !== initialControlData.swipeNavigation
        );
    }, [brandingData, controlData, artist, initialBrandingData, initialControlData]);

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

    const handleHome = () => {
        router.dismissAll();
    };

    const handleBack = () => {
        router.back();
    };

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    const updateBrandingData = (updates: Partial<BrandingDataProps>) => {
        setBrandingData(prev => ({ ...prev, ...updates }));
    };

    const updateControlData = (updates: Partial<ControlDataProps>) => {
        setControlData(prev => ({ ...prev, ...updates }));
    };

    const validateField = (field: string, value: string) => {
        let error = '';

        switch (field) {
            case 'oldPassword':
                if (!value) {
                    error = 'Password is required';
                } else if (value.length < 6) {
                    error = 'Password must be at least 6 characters';
                }
                break;
            case 'password':
                if (!value) {
                    error = 'Password is required';
                } else if (value.length < 6) {
                    error = 'Password must be at least 6 characters';
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    error = 'Please confirm your password';
                } else if (value !== newPassword) {
                    error = 'Passwords do not match';
                }
                break;
        }

        setErrors(prev => ({ ...prev, [field]: error }));
        return error === '';
    };

    const handlePasswordResetConfirm = async () => {
        Keyboard.dismiss();
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast({
                variant: 'error',
                title: 'Please fill in all fields',
                duration: 3000,
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                variant: 'error',
                title: 'Passwords do not match',
                duration: 3000,
            });
            return;
        }

        try {
            setIsUpdatingPassword(true);
            const result = await updatePassword(oldPassword, newPassword);
            if (result.success) {
                updateControlData({ passwordModalOpen: false });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                toast({
                    variant: 'success',
                    title: 'Password updated successfully!',
                    duration: 3000,
                });
            } else {
                toast({
                    variant: 'error',
                    title: result.error || 'Failed to update password',
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('Error updating password:', error);
            toast({
                variant: 'error',
                title: 'An unexpected error occurred',
                duration: 3000,
            });
        }
        finally {
            setIsUpdatingPassword(false);
        }
    }

    const handleDeleteAccountConfirm = async () => {
        try {
            const result = await deleteAccount();
            if (result.success) {
                updateControlData({ deleteAccountModalOpen: false });
                toast({
                    variant: 'success',
                    title: 'Account deleted successfully',
                    duration: 3000,
                });
                // Navigate to main landing page after successful deletion
                router.replace('/');
            } else {
                toast({
                    variant: 'error',
                    title: result.error || 'Failed to delete account',
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            toast({
                variant: 'error',
                title: 'An unexpected error occurred',
                duration: 3000,
            });
        }
    };

    const handleSave = async () => {
        if (!artist?.id || !initialBrandingData || !initialControlData) return;
        try {
            setSaving(true);
            setSaveMessage('Starting...');

            const result = await saveArtistSettings(
                artist.id,
                { branding: brandingData, control: controlData },
                { branding: initialBrandingData, control: initialControlData },
                (p, label) => {
                    if (label) setSaveMessage(label);
                }
            );

            if (result.success) {
                setInitialBrandingData(brandingData);
                setInitialControlData(controlData);

                // Optimistically update store without fetching
                if (artist) {
                    const updatedApp = {
                        ...(artist.app || {}),
                        watermark_image: brandingData.watermarkImage,
                        watermark_text: brandingData.watermarkText,
                        watermark_position: brandingData.watermarkPosition,
                        watermark_opacity: brandingData.watermarkOpacity,
                        watermark_enabled: brandingData.watermarkEnabled,
                        welcome_screen_enabled: brandingData.welcomeScreenEnabled,
                        push_notifications: controlData.pushNotifications,
                        calendar_sync: controlData.calendarSync,
                        swipe_navigation: controlData.swipeNavigation,
                    };

                    // Update main location in local store
                    let updatedLocations = Array.isArray(artist.locations) ? [...artist.locations] : [];
                    const mainIndex = updatedLocations.findIndex((l: any) => (l.is_main_studio ?? l.isMainStudio) === true);

                    if (brandingData.location) {
                        const desired = brandingData.location;
                        const mappedLocation = {
                            id: desired.id,
                            address: desired.address,
                            place_id: desired.placeId,
                            coordinates: {
                                latitude: desired.coordinates.latitude,
                                longitude: desired.coordinates.longitude,
                            },
                            is_main_studio: true,
                        };
                        if (mainIndex >= 0) {
                            updatedLocations[mainIndex] = { ...updatedLocations[mainIndex], ...mappedLocation };
                        } else {
                            updatedLocations.push(mappedLocation as any);
                        }
                    } else {
                        // Remove main location if present
                        if (mainIndex >= 0) {
                            updatedLocations.splice(mainIndex, 1);
                        }
                    }

                    dispatch(setArtist({
                        ...artist,
                        full_name: brandingData.fullName,
                        studio_name: brandingData.studioName,
                        booking_link: brandingData.bookingLink,
                        social_handler: brandingData.socialMediaHandle,
                        photo: brandingData.profilePhoto,
                        avatar: brandingData.avatar,
                        app: updatedApp as any,
                        locations: updatedLocations as any,
                    }));
                }

                toast({
                    variant: 'success',
                    title: 'Changes saved successfully',
                    duration: 2500,
                });
            } else {
                toast({
                    variant: 'error',
                    title: result.error || 'Failed to save changes',
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            toast({
                variant: 'error',
                title: 'An unexpected error occurred',
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
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
                                
                                bottomOffset={20}
                                contentContainerStyle={{
                                    paddingBottom: 80,
                                }}
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
                                            <Control controlData={controlData} updateControlData={updateControlData} artist={artist} />
                                        </Collapse>
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

                <CustomModal
                    visible={controlData.passwordModalOpen}
                    onClose={() => updateControlData({ passwordModalOpen: false })}
                    variant="bottom-sheet"
                    showCloseButton={false}
                    closeOnBackdrop={true}
                    animationDuration={300}
                    backdropOpacity={0.9}
                    borderRadius={40}
                    className="bg-background border border-border border-b-0"
                >
                    <View className="gap-4 px-4 pb-4">
                        <View className="flex-row items-center justify-between">
                            <Text variant="h4">Reset Password</Text>
                        </View>

                        {/* Content */}
                        <View className="gap-4">
                            <View className="gap-2">
                                <Text variant="large">Old Password</Text>
                                <Input
                                    placeholder="Old password"
                                    value={oldPassword}
                                    onChangeText={(text) => {
                                        setOldPassword(text);
                                        if (errors.oldPassword) validateField('oldPassword', text);
                                    }}
                                    onBlur={() => validateField('oldPassword', oldPassword)}
                                    secureTextEntry={!showOldPassword}
                                    autoCapitalize="none"
                                    rightIcon={showOldPassword ? EyeOff : Eye}
                                    onRightIconPress={() => setShowOldPassword(!showOldPassword)}
                                    rightIconLabel="Toggle password visibility"
                                    error={!!errors.oldPassword}
                                    errorText={errors.oldPassword}
                                />
                            </View>

                            <View className="gap-2">
                                <Text variant="large">New Password</Text>
                                <Input
                                    placeholder="New password"
                                    value={newPassword}
                                    onChangeText={(text) => {
                                        setNewPassword(text);
                                        if (errors.newPassword) validateField('newPassword', text);
                                    }}
                                    onBlur={() => validateField('newPassword', newPassword)}
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                    rightIcon={showNewPassword ? EyeOff : Eye}
                                    onRightIconPress={() => setShowNewPassword(!showNewPassword)}
                                    rightIconLabel="Toggle password visibility"
                                    error={!!errors.newPassword}
                                    errorText={errors.newPassword}
                                />
                            </View>

                            <View className="gap-2">
                                <Text variant="large">Confirm Password</Text>
                                <Input
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword) validateField('confirmPassword', text);
                                    }}
                                    onBlur={() => validateField('confirmPassword', confirmPassword)}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    rightIcon={showConfirmPassword ? EyeOff : Eye}
                                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    rightIconLabel="Toggle password visibility"
                                    error={!!errors.confirmPassword}
                                    errorText={errors.confirmPassword}
                                />
                            </View>

                            <View className="gap-2 flex-row mt-4">
                                <View className="flex-1">
                                    <Button
                                        onPress={() => {
                                            updateControlData({ passwordModalOpen: false });
                                            Keyboard.dismiss();
                                        }}
                                        variant="outline"
                                        size='lg'
                                        className='items-center justify-center'
                                    >
                                        <Text>Cancel</Text>
                                    </Button>
                                </View>
                                <View className="flex-1">
                                    <Button variant="outline" onPress={handlePasswordResetConfirm} size='lg' className='items-center justify-center' disabled={isUpdatingPassword}>
                                        {isUpdatingPassword ? (
                                            <View className="flex-row items-center gap-2">
                                                <ActivityIndicator size="small" color={THEME.dark.foreground} />
                                                <Text>Updating...</Text>
                                            </View>
                                        ) : (
                                            <Text>Confirm</Text>
                                        )}
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </View>
                </CustomModal>

                <CustomModal
                    visible={controlData.deleteAccountModalOpen}
                    onClose={() => updateControlData({ deleteAccountModalOpen: false })}
                    variant="bottom-sheet"
                    showCloseButton={false}
                    closeOnBackdrop={true}
                    animationDuration={300}
                    backdropOpacity={0.9}
                    borderRadius={40}
                    className="bg-background-secondary"
                >
                    <View className="gap-4 px-4 pb-4">
                        <View className="gap-6 items-center">
                            <Image source={require('@/assets/images/icons/warning_circle.png')} style={{ width: 80, height: 80 }} />
                            <Text variant="h3" className="text-center">Delete Account</Text>
                            <Text className="text-text-secondary text-center text-sm leading-5">Are you sure you want to permanently delete your account? This cannot be undone</Text>

                            <View className="gap-2 flex-row w-full">
                                <View className="flex-1">
                                    <Button variant="outline" onPress={() => updateControlData({ deleteAccountModalOpen: false })} size='lg' className='items-center justify-center'>
                                        <Text>Cancel</Text>
                                    </Button>
                                </View>
                                <View className="flex-1">
                                    <Button variant="outline" onPress={handleDeleteAccountConfirm} size='lg' className='items-center justify-center'>
                                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Delete Account</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </View>
                </CustomModal>

                <LoadingOverlay
                    visible={saving}
                    title="Saving changes"
                    subtitle={saveMessage}
                />
            </SafeAreaView >
        </>
    );
}