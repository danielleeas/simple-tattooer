import { useEffect, useState } from "react";
import { View, Image, Pressable, Modal, Dimensions } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as ExpoImagePicker from 'expo-image-picker';

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useToast } from '@/lib/contexts';
import { compressImage } from '@/lib/utils';
import { uploadFileToStorage } from '@/lib/services/storage-service';
import { createDrawing, getLatestDrawingForProject, updateDrawing } from '@/lib/services/drawing-service';

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import UPLOAD from '@/assets/images/icons/camera.png';
import { Textarea } from "@/components/ui/textarea";

interface UploadedImage {
    id: string;
    uri: string;
    name?: string;
    drawingId?: string;
    storageUrl?: string;
}
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
export default function UploadDrawings() {
    const params = useLocalSearchParams();
    const projectId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

    const [image, setImage] = useState<UploadedImage | null>(null);
    const [existingDrawingId, setExistingDrawingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [optionOpen, setOptionOpen] = useState(false);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const [notes, setNotes] = useState<string>('');

    const { toast } = useToast();
    const hasExistingDrawing = !!image && !!image.drawingId;
    const hasSelectedImage = !!image;

    useEffect(() => {
        let active = true;
        async function load() {
            if (!projectId) return;
            setInitializing(true);
            try {
                const res = await getLatestDrawingForProject(projectId);
                if (!active) return;
                if (res.success && res.data) {
                    setImage({
                        id: res.data.id,
                        drawingId: res.data.id,
                        uri: res.data.image_url,
                        name: `drawing_${res.data.id}.jpg`,
                        storageUrl: res.data.image_url,
                    });
                    setExistingDrawingId(res.data.id);
                    setNotes(res.data.artist_notes || '');
                } else {
                    setImage(null);
                    setExistingDrawingId(null);
                    setNotes('');
                }
            } finally {
                if (active) setInitializing(false);
            }
        }
        load();
        return () => { active = false; };
    }, [projectId]);

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    const handleImageSelected = (uri: string) => {
        const newImage: UploadedImage = {
            id: Date.now().toString(),
            uri: uri,
            name: `drawing_${Date.now()}.jpg`
        };
        setImage(newImage);
    };

    const handleImageRemoved = () => {
        // Only clear local selection/preview; keep existingDrawingId for update on save
        setImage(null);
    };

    const requestPermissions = async () => {
        const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toast({
                title: 'Permission Required',
                description: 'Sorry, we need camera roll permissions to make this work!',
                variant: 'error',
            });
            return false;
        }
        return true;
    };

    const pickImage = async () => {
        setOptionOpen(false);
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            setLoading(false);
            return;
        }

        try {
            const result = await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const selectedImage = result.assets[0].uri;
                const compressed = await compressImage(selectedImage, 0.8);
                handleImageSelected(compressed);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            toast({
                title: 'Error',
                description: 'Failed to pick image. Please try again.',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const takePhoto = async () => {
        setOptionOpen(false);
        const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            toast({
                title: 'Permission Required',
                description: 'Sorry, we need camera permissions to make this work!',
                variant: 'error',
            });
            setLoading(false);
            return;
        }

        try {
            const result = await ExpoImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const selectedImage = result.assets[0].uri;
                const compressed = await compressImage(selectedImage, 0.8);
                handleImageSelected(compressed);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            toast({
                title: 'Error',
                description: 'Failed to take photo. Please try again.',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUploadPress = () => {
        setLoading(true);
        setOptionOpen(true);
    };

    const handleSaveDrawing = async () => {
        if (!projectId) {
            toast({
                title: 'Error',
                description: 'Missing project reference. Please go back and try again.',
                variant: 'error',
            });
            return;
        }

        try {
            setSaving(true);

            if (existingDrawingId) {
                let newImageUrl: string | undefined;
                // If a new local image is selected (non-http), upload it
                if (image && typeof image.uri === 'string' && !image.uri.startsWith('http')) {
                    const fileUpload = {
                        uri: image.uri,
                        name: image.name || `drawing_${Date.now()}.jpg`,
                        type: 'image/jpeg',
                        size: 0,
                    };
                    const uploadResult = await uploadFileToStorage(fileUpload, 'artist-drawings', projectId);
                    if (!uploadResult.success || !uploadResult.url) {
                        toast({
                            title: 'Upload Failed',
                            description: uploadResult.error || 'Could not upload image to storage.',
                            variant: 'error',
                        });
                        return;
                    }
                    newImageUrl = uploadResult.url;
                }

                const updateRes = await updateDrawing(existingDrawingId, {
                    image_url: newImageUrl,
                    artist_notes: notes || null,
                });
                if (!updateRes.success) {
                    toast({
                        title: 'Save Failed',
                        description: updateRes.error || 'Could not update drawing.',
                        variant: 'error',
                    });
                    return;
                }
            } else {
                // New drawing: require an image
                if (!image?.uri) {
                    toast({
                        title: 'No image selected',
                        description: 'Please choose an image to upload.',
                        variant: 'error',
                    });
                    return;
                }

                const fileUpload = {
                    uri: image.uri,
                    name: image.name || `drawing_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                    size: 0,
                };

                const uploadResult = await uploadFileToStorage(fileUpload, 'artist-drawings', projectId);
                if (!uploadResult.success || !uploadResult.url) {
                    toast({
                        title: 'Upload Failed',
                        description: uploadResult.error || 'Could not upload image to storage.',
                        variant: 'error',
                    });
                    return;
                }

                const saveResult = await createDrawing({
                    project_id: projectId,
                    image_url: uploadResult.url,
                    artist_notes: notes || null,
                });
                if (!saveResult.success) {
                    toast({
                        title: 'Save Failed',
                        description: saveResult.error || 'Could not save drawing.',
                        variant: 'error',
                    });
                    return;
                }
            }

            toast({
                title: 'Drawing uploaded — keep an eye out for updates.',
                variant: 'success',
            });

            router.back();
        } catch (e: any) {
            console.error('Error saving drawing:', e);
            toast({
                title: 'Error',
                description: e?.message || 'Failed to save drawing. Please try again.',
                variant: 'error',
            });
        } finally {
            setSaving(false);
        }
    }

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
                    <View className="flex-1 bg-background px-4 pt-2 gap-6">
                        <View className="flex-1">
                            <KeyboardAwareScrollView
                                bottomOffset={80}
                                contentContainerClassName="w-full"
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                <View className="gap-6 pb-6">
                                    <View className="items-center justify-center pb-[22px] h-[180px]">
                                        <Image
                                            source={require('@/assets/images/icons/drawing.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Upload</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">Drawings</Text>
                                        <Text className="text-center mt-2 text-text-secondary">Upload your drawing for this project. It stays</Text>
                                        <Text className="text-center text-text-secondary leading-none">private until you're ready.</Text>
                                    </View>

                                    <View className="gap-6">
                                        <View className="gap-1 items-center">
                                            <Pressable
                                                className="h-[172px] gap-2 w-full border border-dashed border-border rounded-xl items-center justify-center"
                                                onPress={handleUploadPress}
                                                disabled={loading || hasExistingDrawing || hasSelectedImage}
                                            >
                                                <View className='w-20 h-20 flex items-center bg-background-secondary border border-border justify-center rounded-full'>
                                                    <Image source={UPLOAD} style={{ width: 42, height: 42 }} />
                                                </View>
                                                <View className="gap-1 items-center">
                                                    <Text className="text-text-secondary">
                                                        {loading
                                                            ? 'Selecting...'
                                                            : hasExistingDrawing
                                                                ? 'Remove existing drawing to replace'
                                                                : hasSelectedImage
                                                                    ? 'Remove selected image to replace'
                                                                    : 'Choose Image'}
                                                    </Text>
                                                    <Text className="text-text-secondary text-xs">PNG, JPG, HEIC up to 10MB</Text>
                                                </View>
                                            </Pressable>
                                            <Text className="text-xs">Add a drawing — so client can preview them</Text>
                                        </View>

                                        {!!image && (
                                            <View className="gap-4">
                                                <Pressable onPress={() => handleImagePress(image.uri)} className="relative self-start">
                                                    <Image
                                                        source={{ uri: image.uri }}
                                                        className="w-24 h-24 rounded-lg"
                                                        resizeMode="cover"
                                                    />
                                                    <Pressable
                                                        onPress={handleImageRemoved}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full items-center justify-center"
                                                    >
                                                        <Text className="text-white text-xs font-bold">×</Text>
                                                    </Pressable>
                                                </Pressable>
                                            </View>
                                        )}

                                        <View className="gap-2">
                                            <Text variant="h5">Add any quick notes for your client (Optional)</Text>
                                            <Textarea
                                                placeholder="Add any quick notes for your client"
                                                className="h-[120px]"
                                                value={notes}
                                                onChangeText={setNotes}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                        <View className="pb-8">
                            <Button disabled={saving || initializing || (!existingDrawingId && !image)} variant="outline" size="lg" onPress={handleSaveDrawing}>
                                <Text>{saving ? 'Saving...' : 'Save Drawing'}</Text>
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>

            <Modal
                visible={optionOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setOptionOpen(false)}
            >
                <View className="flex-1 justify-center p-4">
                    <Pressable
                        className="absolute inset-0 bg-black/50"
                        onPress={() => setOptionOpen(false)}
                    />
                    <View className="bg-background-secondary p-4 rounded-2xl">
                        <View className="mb-2">
                            <Text className="text-lg font-semibold">Select Image</Text>
                            <Text className="text-text-secondary mt-1">Choose how you want to add an image</Text>
                        </View>
                        <View className='flex-row gap-2 items-center justify-center'>
                            <Button variant="outline" onPress={takePhoto}>
                                <Text>Camera</Text>
                            </Button>
                            <Button variant="outline" onPress={pickImage}>
                                <Text>Photo Library</Text>
                            </Button>
                            <Button variant="outline" onPress={() => setOptionOpen(false)}>
                                <Text>Cancel</Text>
                            </Button>
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
                        <View className="bg-white/20 rounded-full p-2">
                            <Image
                                source={require('@/assets/images/icons/x_circle.png')}
                                style={{ width: 32, height: 32 }}
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
        </>
    );
}
