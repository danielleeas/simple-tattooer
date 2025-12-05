import { useState } from "react";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientHeader from "@/components/lib/client-header";
import { View, Image, ImageBackground, Pressable, Dimensions, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import * as ExpoImagePicker from 'expo-image-picker';
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { useToast } from "@/lib/contexts/toast-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ReviewDrawing() {
    const { toast } = useToast();
    const [approveDesignModalOpen, setApproveDesignModalOpen] = useState(false);
    const [requestChangesModalOpen, setRequestChangesModalOpen] = useState(false);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const [photos, setPhotos] = useState<any[]>([]);

    const imageWidth = screenWidth - 32;

    const handleCloseModal = () => {
        setApproveDesignModalOpen(false);
        setRequestChangesModalOpen(false);
    };

    const handleBack = () => {
        router.back();
    };

    const handleContinue = () => {
        setRequestChangesModalOpen(false);
        router.dismissTo('/');
        toast({
            variant: 'success',
            title: 'Reschedule request sent!',
            description: "We’ll inform the artist to select a new date that works for you. Thank you for your patience!",
            duration: 3000,
        });
    }

    const handleBackToDashboard = () => {
        setApproveDesignModalOpen(false);
        router.dismissTo('/');
    }

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
    const handleImageSelected = (category: 'photos', imageSource: string | any) => {
        console.log(`Adding image to ${category}:`, imageSource);
        switch (category) {
            case 'photos':
                if (photos.length < 3) {
                    setPhotos(prev => {
                        const newPhotos = [...prev, imageSource];
                        console.log('New photos:', newPhotos);
                        return newPhotos;
                    });
                }
                break;
        }
    };

    // Handle image removal for different categories
    const handleImageRemoved = (category: 'photos' | 'session' | 'healed', index: number) => {
        switch (category) {
            case 'photos':
                setPhotos(prev => prev.filter((_, i) => i !== index));
                break;
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <ClientHeader
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={100}
                    enabled={true}
                >
                    <View className="flex-1 pt-2 pb-4 gap-6">
                        <View className="flex-1">
                            <KeyboardAwareScrollView bottomOffset={50} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                                    <View className="items-center justify-center" style={{ height: 180 }}>
                                        <Image
                                            source={require('@/assets/images/icons/drawings.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Review</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Drawing</Text>
                                        <Text className="text-center mt-2 text-text-secondary">Take a peek and let us know if it feels right</Text>
                                    </View>

                                    <View className="gap-6">
                                        <View style={{ width: imageWidth, height: imageWidth }} className="overflow-hidden rounded-lg">
                                            <Image
                                                source={require('@/assets/images/tattoos/tattoos_19.png')}
                                                style={{ width: "100%", height: "100%" }}
                                                resizeMode="cover"
                                            /> 
                                        </View>
                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                        <View className="gap-4 items-center justify-center px-4">
                            <Button size="lg" className="w-full" onPress={() => setApproveDesignModalOpen(true)}>
                                <Text>I approve my design</Text>
                            </Button>

                            <Button size="lg" className="w-full" onPress={() => setRequestChangesModalOpen(true)} variant="outline">
                                <Text>Request Changes</Text>
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>

                <Modal
                    visible={approveDesignModalOpen}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setApproveDesignModalOpen(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <Pressable
                            style={{ flex: 1 }}
                            onPress={() => setApproveDesignModalOpen(false)}
                        />
                        <View className="bg-background-secondary rounded-t-3xl pb-10 gap-6 px-4">
                        <Text className="hidden">Approve Design</Text>
                        <View className="gap-2 w-full items-center justify-center pb-8">
                            <Image
                                source={require('@/assets/images/icons/line_check_circle.png')}
                                style={{ width: 80, height: 80 }}
                                resizeMode="contain"
                            />
                            <Text variant="h3" className="tracking-tight">Appointment Confirmed!</Text>
                            <View className="gap-1">
                                <Text variant="small" className="text-center">Looking forward to the session! Feel free</Text>
                                <Text variant="small" className="text-center">to reach out to the artist with any questions.</Text>
                            </View>
                        </View>
                        <View className="gap-2 flex-row">
                            <View className="flex-1">
                                <Button onPress={handleBackToDashboard} size='lg' className='items-center justify-center'>
                                    <Text>Back to dashboard</Text>
                                </Button>
                            </View>
                        </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={requestChangesModalOpen}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setRequestChangesModalOpen(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <Pressable
                            style={{ flex: 1 }}
                            onPress={() => setRequestChangesModalOpen(false)}
                        />
                        <View className="bg-background-secondary rounded-t-3xl p-6 gap-6">
                        <Text className="hidden">Reschedule</Text>
                        <View className="gap-6 w-full">
                            <View className="gap-1">
                                <Text variant="h5">Explain your change requests</Text>
                                <Text variant="small" className="text-text-secondary">Keep the requests simple and respectful.</Text>
                            </View>
                            <Textarea placeholder="Type your message here" className="min-h-28" />
                            <View className="flex-row items-center justify-start gap-2">
                                <Text variant="h5">Upload a Photo (Max 3)</Text>
                                <Pressable onPress={() => {
                                    if (photos.length < 3) {
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
                                                handleImageSelected('photos', result.assets[0].uri);
                                            }
                                        };
                                        pickImage();
                                    }
                                }}>
                                    <Image source={require('@/assets/images/icons/camera.png')} style={{ width: 32, height: 32 }} />
                                </Pressable>
                            </View>
                            {photos.length > 0 && (
                                <View className="flex-row flex-wrap justify-start gap-x-2 gap-y-4">
                                    {photos.map((photoSource, index) => {
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
                                                        onPress={() => handleImageRemoved('photos', index)}
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
                        <View className="gap-2 flex-row">
                            <View className="flex-1">
                                <Button onPress={handleCloseModal} variant="outline" size='lg' className='items-center justify-center'>
                                    <Text>Cancel</Text>
                                </Button>
                            </View>
                            <View className="flex-1">
                                <Button onPress={handleContinue} size='lg' className='items-center justify-center'>
                                    <Text>Continue</Text>
                                </Button>
                            </View>
                        </View>
                        </View>
                    </View>
                </Modal>

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
    );
}