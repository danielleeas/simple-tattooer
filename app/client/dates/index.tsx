import { RelativePathString, router, Stack } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ScrollView, Modal, Image, Pressable } from "react-native";
import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import ClientHeader from "@/components/lib/client-header";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react-native";
import { FileSearch, FileText } from "lucide-react-native";
import { Dimensions } from "react-native";
import * as ExpoImagePicker from 'expo-image-picker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function YourDatesPage() {
    const [leftArmSleeveColOpened, setLeftArmSleeveColOpened] = useState(true);
    const [rightArmSleeveColOpened, setRightArmSleeveColOpened] = useState(false);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const [referencePhotos, setReferencePhotos] = useState<any[]>([
        require('@/assets/images/tattoos/tattoos_14.png'),
        require('@/assets/images/tattoos/tattoos_15.png'),
        require('@/assets/images/tattoos/tattoos_16.png')
    ]);

    const [healedPhotos, setHealedPhotos] = useState<any[]>([
        require('@/assets/images/tattoos/tattoos_14.png'),
        require('@/assets/images/tattoos/tattoos_15.png'),
        require('@/assets/images/tattoos/tattoos_16.png')
    ]);

    const handleBack = () => {
        router.back();
    };

    const handleReschedule = () => {
        router.push('/client/dates/reschedule' as RelativePathString);
    };

    // Handle image press to open full-screen viewer
    const handleImagePress = (imageSource: any) => {
        console.log('Opening image viewer for:', imageSource);
        // Convert URI string to proper format for Image component
        const imageToShow = typeof imageSource === 'string' ? { uri: imageSource } : imageSource;
        setSelectedImageSource(imageToShow);
        setIsImageViewerVisible(true);
    };

    // Handle closing the image viewer
    const handleCloseImageViewer = () => {
        setIsImageViewerVisible(false);
        setSelectedImageSource(null);
    };

    // Handle image selection for different categories
    const handleImageSelected = (category: 'reference' | 'healed', imageSource: string | any) => {
        console.log(`Adding image to ${category}:`, imageSource);
        switch (category) {
            case 'reference':
                if (referencePhotos.length < 3) {
                    setReferencePhotos(prev => {
                        const newPhotos = [...prev, imageSource];
                        console.log('New reference photos:', newPhotos);
                        return newPhotos;
                    });
                }
                break;
            case 'healed':
                setHealedPhotos(prev => {
                    const newPhotos = [...prev, imageSource];
                    console.log('New healed photos:', newPhotos);
                    return newPhotos;
                });
                break;
        }
    };

    // Handle image removal for different categories
    const handleImageRemoved = (category: 'reference' | 'healed', index: number) => {
        switch (category) {
            case 'reference':
                setReferencePhotos(prev => prev.filter((_, i) => i !== index));
                break;
            case 'healed':
                setHealedPhotos(prev => prev.filter((_, i) => i !== index));
                break;
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className="flex-1 bg-background">
                <ClientHeader
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                />
                <StableGestureWrapper onSwipeRight={handleBack} threshold={80} enabled={true}>
                <View className="flex-1 pt-2 pb-4 gap-6">
                        <View className="flex-1">
                            <ScrollView contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-7">
                                    <View className="items-center justify-center" style={{ height: 180 }}>
                                        <Image
                                            source={require('@/assets/images/icons/calendar.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Your</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Dates</Text>
                                        <Text className="text-center mt-2 text-text-secondary">All your tattoo appointments in one place-easy</Text>
                                        <Text className="text-center text-text-secondary leading-none">to check, easy to change</Text>
                                    </View>
                                    <View className="gap-6">
                                        <View className="gap-2">
                                            <Pressable className="flex-row items-center justify-between gap-2" onPress={() => setLeftArmSleeveColOpened(!leftArmSleeveColOpened)}>
                                                <View className="flex-row items-center gap-2">
                                                    <View className="h-2 w-2 rounded-full bg-foreground"></View>
                                                    <Text variant="h4" >Left Arm Sleeve —</Text>
                                                </View>
                                                <Icon as={leftArmSleeveColOpened ? ChevronUp : ChevronDown} strokeWidth={1} size={32} />
                                            </Pressable>
                                            {leftArmSleeveColOpened && (
                                                <View className="flex-row w-full justify-between">
                                                    <View className="gap-5">
                                                        <View className="gap-1">
                                                            <Text variant="h5">Sat, July 5, 2025</Text>
                                                            <Text className="text-text-secondary leading-none">09.00am - 11.00am</Text>
                                                            <Text className="text-text-secondary leading-none">Dark Ocean Tattoo Studio</Text>
                                                        </View>
                                                        <View className="gap-1">
                                                            <Text variant="h5">Sat, July 5, 2025</Text>
                                                            <Text className="text-text-secondary leading-none">09.00am - 11.00am</Text>
                                                            <Text className="text-text-secondary leading-none">Dark Ocean Tattoo Studio</Text>
                                                        </View>
                                                    </View>
                                                    <View className="w-[120px] gap-2">
                                                        <Image source={require('@/assets/images/tattoos/tattoos_17.png')} style={{ width: "100%", height: 60, borderRadius: 5 }} />
                                                        <Text className="text-text-secondary leading-none text-center" style={{ fontSize: 10 }}>Tap to view your design - request changes anytime</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                        <View className="gap-2">
                                            <Pressable className="flex-row items-center justify-between gap-2" onPress={() => setRightArmSleeveColOpened(!rightArmSleeveColOpened)}>
                                                <View className="flex-row items-center gap-2">
                                                    <View className="h-2 w-2 rounded-full bg-foreground"></View>
                                                    <Text variant="h4" >Right Arm Sleeve —</Text>
                                                </View>
                                                <Icon as={rightArmSleeveColOpened ? ChevronUp : ChevronDown} strokeWidth={1} size={32} />
                                            </Pressable>
                                            {rightArmSleeveColOpened && (
                                                <View className="flex-row w-full justify-between">
                                                    <View className="gap-5">
                                                        <View className="gap-1">
                                                            <Text variant="h5">Sat, July 5, 2025</Text>
                                                            <Text className="text-text-secondary leading-none">09.00am - 11.00am</Text>
                                                            <Text className="text-text-secondary leading-none">Dark Ocean Tattoo Studio</Text>
                                                        </View>
                                                        <View className="gap-1">
                                                            <Text variant="h5">Sat, July 5, 2025</Text>
                                                            <Text className="text-text-secondary leading-none">09.00am - 11.00am</Text>
                                                            <Text className="text-text-secondary leading-none">Dark Ocean Tattoo Studio</Text>
                                                        </View>
                                                    </View>
                                                    <View className="w-[120px] gap-2">
                                                        <Image source={require('@/assets/images/tattoos/tattoos_17.png')} style={{ width: "100%", height: 60, borderRadius: 5 }} />
                                                        <Text className="text-text-secondary leading-none text-center" style={{ fontSize: 10 }}>Tap to view your design - request changes anytime</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                        <View className="gap-4">
                                            <View className="w-full gap-2">
                                                <Button variant="outline" onPress={handleReschedule}>
                                                    <Text>Reschedule/Cancel</Text>
                                                </Button>
                                            </View>
                                            <View className="w-full gap-2">
                                                <Button variant="outline">
                                                    <Text>Join Cancellation List</Text>
                                                </Button>
                                                <Text className="text-text-secondary leading-none text-center text-xs">Want an earlier spot? Join the list for a chance to move up</Text>
                                            </View>
                                            <View className="w-full gap-2">
                                                <Button variant="outline">
                                                    <Text>Book A New Project</Text>
                                                </Button>
                                            </View>
                                        </View>
                                        <View className="gap-4">
                                            <View className="flex-row items-center justify-start gap-2">
                                                <Text variant="h4">Your Waiver:</Text>
                                                <Image source={require('@/assets/images/icons/rules.png')} style={{ width: 40, height: 40 }} />
                                            </View>
                                            <View className="flex-row gap-2 bg-background-secondary p-4 rounded-lg">
                                                <View className="h-12 w-12 rounded-full bg-foreground items-center justify-center">
                                                    <Icon as={FileText} strokeWidth={2} size={20} className="text-background" />
                                                </View>
                                                <View className="gap-2 flex-1">
                                                    <View style={{ width: 48, height: 19 }} className="border border-green items-center justify-center rounded-full px-1">
                                                        <Text className="text-green text-xs" style={{ fontSize: 10 }}>Signed</Text>
                                                    </View>
                                                    <Text variant="small">Michael's_Tattoo_Agreement.pdf</Text>
                                                    <View className="flex-row items-center gap-1">
                                                        <Text variant="small">Preview</Text>
                                                        <Icon as={FileSearch} strokeWidth={2} size={16} />
                                                    </View>
                                                </View>
                                            </View>
                                            <Text className="text-text-secondary text-sm tracking-wide">If the waiver isn't signed you'll see it here. It's also emailed to you.</Text>
                                        </View>
                                        <View className="gap-4">
                                            <View className="flex-row items-center justify-start gap-4">
                                                <Text variant="h5">Reference Photo Uploads</Text>
                                                <Pressable onPress={() => {
                                                    if (referencePhotos.length < 3) {
                                                        const pickImage = async () => {
                                                            const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
                                                            if (status !== 'granted') return;

                                                            const result = await ExpoImagePicker.launchImageLibraryAsync({
                                                                mediaTypes: ['images'],
                                                                allowsEditing: true,
                                                                aspect: [1, 1],
                                                                quality: 0.8,
                                                            });

                                                            if (!result.canceled && result.assets[0]) {
                                                                console.log('Selected image URI:', result.assets[0].uri);
                                                                handleImageSelected('reference', result.assets[0].uri);
                                                            }
                                                        };
                                                        pickImage();
                                                    }
                                                }}>
                                                    <Image source={require('@/assets/images/icons/camera.png')} style={{ width: 32, height: 32 }} />
                                                </Pressable>
                                            </View>
                                            {referencePhotos.length > 0 && (
                                                <View className="flex-row flex-wrap justify-start gap-x-2 gap-y-4">
                                                    {referencePhotos.map((photoSource, index) => {
                                                        const isLast = index % 3 === 2;
                                                        const isFirst = index % 3 === 0;
                                                        return (
                                                            <View key={index} className={`${isFirst ? 'items-start' : isLast ? 'items-end' : 'items-center'}`} style={{ width: '31%' }}>
                                                                <View className="relative" style={{ width: 100 }}>
                                                                    <Pressable onPress={() => handleImagePress(photoSource)}>
                                                                        <Image
                                                                            source={typeof photoSource === 'string' ? { uri: photoSource } : photoSource}
                                                                            style={{ width: '100%', height: 100, borderRadius: 10 }}
                                                                            resizeMode="contain"
                                                                        />
                                                                    </Pressable>
                                                                    <Pressable
                                                                        className="absolute"
                                                                        style={{ top: -7, right: -5 }}
                                                                        onPress={() => handleImageRemoved('reference', index)}
                                                                    >
                                                                        <Image
                                                                            source={require('@/assets/images/icons/x_circle.png')}
                                                                            style={{ width: 24, height: 24 }}
                                                                            resizeMode="contain"
                                                                        />
                                                                    </Pressable>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                        <View className="gap-4">
                                            <View className="flex-row items-center justify-start gap-4">
                                                <Text variant="h5">Healed Photo Upload</Text>
                                                <Pressable>
                                                    <Image source={require('@/assets/images/icons/camera.png')} style={{ width: 32, height: 32 }} />
                                                </Pressable>
                                            </View>
                                            {healedPhotos.length > 0 && (
                                                <View className="flex-row flex-wrap justify-start gap-x-2 gap-y-4">
                                                    {healedPhotos.map((photoSource, index) => {
                                                        const isLast = index % 3 === 2;
                                                        const isFirst = index % 3 === 0;
                                                        return (
                                                            <View key={index} className={`${isFirst ? 'items-start' : isLast ? 'items-end' : 'items-center'}`} style={{ width: '31%' }}>
                                                                <View className="relative" style={{ width: 100 }}>
                                                                    <Pressable onPress={() => handleImagePress(photoSource)}>
                                                                        <Image
                                                                            source={typeof photoSource === 'string' ? { uri: photoSource } : photoSource}
                                                                            style={{ width: '100%', height: 100, borderRadius: 10 }}
                                                                            resizeMode="contain"
                                                                        />
                                                                    </Pressable>
                                                                    <Pressable
                                                                        className="absolute"
                                                                        style={{ top: -7, right: -5 }}
                                                                        onPress={() => handleImageRemoved('healed', index)}
                                                                    >
                                                                        <Image
                                                                            source={require('@/assets/images/icons/x_circle.png')}
                                                                            style={{ width: 24, height: 24 }}
                                                                            resizeMode="contain"
                                                                        />
                                                                    </Pressable>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </StableGestureWrapper>
                {/* Full-screen Image Viewer Modal */}
                <Modal
                    visible={isImageViewerVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={handleCloseImageViewer}
                >
                    <View className="flex-1 bg-black/90 justify-center items-center">
                        <Pressable
                            className="absolute top-4 right-4 z-10"
                            onPress={handleCloseImageViewer}
                        >
                            <View className="rounded-full p-2">
                                <Image
                                    source={require('@/assets/images/icons/x_circle.png')}
                                    style={{ width: 32, height: 32, borderRadius: 20 }}
                                    resizeMode="contain"
                                />
                            </View>
                        </Pressable>

                        <Pressable
                            className="flex-1 w-full justify-center items-center"
                            onPress={handleCloseImageViewer}
                        >
                            <Image
                                source={selectedImageSource}
                                style={{
                                    width: screenWidth - 40,
                                    height: screenHeight - 100,
                                    maxWidth: screenWidth,
                                    maxHeight: screenHeight
                                }}
                                resizeMode="contain"
                            />
                        </Pressable>
                    </View>
                </Modal>
            </SafeAreaView>
        </>
    )
}