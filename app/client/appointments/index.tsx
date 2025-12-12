import { RelativePathString, router, Stack } from "expo-router";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ScrollView, Modal, Image, Pressable, ActivityIndicator } from "react-native";
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
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { getClientProjectsWithSessions } from '@/lib/services/clients-service';
import { updateClient } from '@/lib/services/clients-service';
import { setClient } from '@/lib/redux/slices/auth-slice';
import { compressImage } from '@/lib/utils';
import { uploadFileToStorage, deleteFileFromStorage } from '@/lib/services/storage-service';
import { useToast } from '@/lib/contexts/toast-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProjectWithSessions {
    id: string;
    title: string;
    status: string;
    waiver_signed: boolean;
    waiver_url: string;
    drawing: Array<{
        id: string;
        image_url: string;
        is_approved: boolean;
    }>;
    sessions: Array<{
        id: string;
        date: string;
        start_time: string;
        duration: number;
        location: {
            address: string;
        };
        session_rate: number;
        created_at: string;
    }>;
}

export default function YourDatesPage() {
    const { toast } = useToast();
    const dispatch = useDispatch();
    const client = useSelector((state: RootState) => state.auth.client);
    const artist = useSelector((state: RootState) => state.artist.artist);

    const [projects, setProjects] = useState<ProjectWithSessions[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedProjects, setExpandedProjects] = useState<{ [key: string]: boolean }>({});
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const [referencePhotos, setReferencePhotos] = useState<string[]>([]);
    const [healedPhotos, setHealedPhotos] = useState<string[]>([]);
    const [referencePhotoOptionOpen, setReferencePhotoOptionOpen] = useState(false);
    const [healedPhotoOptionOpen, setHealedPhotoOptionOpen] = useState(false);
    const [uploadingReference, setUploadingReference] = useState(false);
    const [uploadingHealed, setUploadingHealed] = useState(false);

    const handleBack = () => {
        router.back();
    };

    const handleReschedule = () => {
        router.push('/client/appointments/reschedule' as RelativePathString);
    };

    useEffect(() => {
        if (client?.id && artist?.id) {
            loadProjects();
        }
    }, [client?.id, artist?.id]);

    // Load existing photos from client data
    useEffect(() => {
        if ((client as any)?.reference_photos) {
            setReferencePhotos((client as any).reference_photos);
        }
        if ((client as any)?.healed_photos) {
            setHealedPhotos((client as any).healed_photos);
        }
    }, [client]);

    const loadProjects = async () => {
        if (!client?.id || !artist?.id) return;

        setLoading(true);
        try {
            const projectsData = await getClientProjectsWithSessions(artist.id, client.id);
            setProjects(projectsData);

            // Auto-expand first project if available
            if (projectsData.length > 0) {
                setExpandedProjects({ [projectsData[0].id]: true });
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Failed to load your appointments',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLowerCase();
    };

    const formatTimeRange = (startTime: string, duration: number) => {
        const [hours, minutes] = startTime.split(':');
        const startDate = new Date();
        startDate.setHours(parseInt(hours), parseInt(minutes));

        const endDate = new Date(startDate.getTime() + duration * 60000);

        const startTimeFormatted = startDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLowerCase();

        const endTimeFormatted = endDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLowerCase();

        return `${startTimeFormatted} - ${endTimeFormatted}`;
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
    const handleImageSelected = async (category: 'reference' | 'healed', imageUri: string) => {
        if (!client?.id) return;

        const setUploading = category === 'reference' ? setUploadingReference : setUploadingHealed;
        const closeModal = category === 'reference' ? setReferencePhotoOptionOpen : setHealedPhotoOptionOpen;

        // Immediately show the photo in UI
        const currentPhotos = category === 'reference' ? referencePhotos : healedPhotos;
        const updatedPhotos = [...currentPhotos, imageUri]; // Use local URI for immediate display

        // Update UI immediately
        if (category === 'reference') {
            setReferencePhotos(updatedPhotos);
        } else {
            setHealedPhotos(updatedPhotos);
        }

        closeModal(false);

        // Upload in background
        try {
            setUploading(true);

            // Compress the image
            const compressed = await compressImage(imageUri, 0.8);

            // Upload to client-photos bucket
            const fileUpload = {
                uri: compressed,
                name: `${category}_photo_${Date.now()}.jpg`,
                type: 'image/jpeg',
                size: 0,
            };

            const uploadResult = await uploadFileToStorage(fileUpload, 'client-photos', client.id);
            if (!uploadResult.success || !uploadResult.url) {
                // Upload failed - remove from UI and show error
                const photosAfterFailure = category === 'reference' ? referencePhotos : healedPhotos;
                const finalPhotos = photosAfterFailure.filter(uri => uri !== imageUri);

                if (category === 'reference') {
                    setReferencePhotos(finalPhotos);
                } else {
                    setHealedPhotos(finalPhotos);
                }

                toast({
                    title: 'Upload Failed',
                    description: uploadResult.error || 'Could not upload photo.',
                    variant: 'error',
                });
                return;
            }

            // Upload successful - update with real URL
            const photosWithRealUrl = updatedPhotos.map(uri =>
                uri === imageUri ? uploadResult.url : uri
            ).filter((url): url is string => url !== undefined);

            if (category === 'reference') {
                setReferencePhotos(photosWithRealUrl);
            } else {
                setHealedPhotos(photosWithRealUrl);
            }

            // Update database in background
            const updateData = category === 'reference'
                ? { reference_photos: photosWithRealUrl }
                : { healed_photos: photosWithRealUrl };

            const updateResult = await updateClient(client.id, updateData);
            if (updateResult.success) {
                // Update Redux state
                dispatch(setClient({
                    ...client,
                    ...updateData
                }));

                // Photo uploaded successfully (no toast needed)
            } else {
                // Database update failed - show error but keep photo in UI
                console.error('Database update failed:', updateResult.error);
                toast({
                    title: 'Upload completed but sync failed',
                    description: 'Photo uploaded but may not appear on reload.',
                    variant: 'error',
                });
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            // Remove failed photo from UI
            const photosAfterError = category === 'reference' ? referencePhotos : healedPhotos;
            const finalPhotos = photosAfterError.filter(uri => uri !== imageUri);

            if (category === 'reference') {
                setReferencePhotos(finalPhotos);
            } else {
                setHealedPhotos(finalPhotos);
            }

            toast({
                title: 'Upload Failed',
                description: 'Failed to upload photo. Please try again.',
                variant: 'error',
            });
        } finally {
            setUploading(false);
        }
    };

    // Handle image removal for different categories
    const handleImageRemoved = async (category: 'reference' | 'healed', index: number) => {
        if (!client?.id) return;

        const currentPhotos = category === 'reference' ? referencePhotos : healedPhotos;
        const photoToDelete = currentPhotos[index];

        // Immediately remove from UI
        const updatedPhotos = currentPhotos.filter((_, i) => i !== index);

        if (category === 'reference') {
            setReferencePhotos(updatedPhotos);
        } else {
            setHealedPhotos(updatedPhotos);
        }

        // Delete in background
        try {
            if (photoToDelete) {
                // Extract file path from Supabase URL
                // URL format: https://rrjceacgpemebgmooeny.supabase.co/storage/v1/object/public/client-photos/{clientId}/{filename}
                const urlParts = photoToDelete.split('/client-photos/');
                if (urlParts.length === 2) {
                    const filePath = urlParts[1]; // This gives us {clientId}/{filename}

                    // Delete from Supabase storage
                    const deleteResult = await deleteFileFromStorage('client-photos', filePath);
                    if (!deleteResult.success) {
                        console.error('Failed to delete from storage:', deleteResult.error);
                        // Continue with database update even if storage delete fails
                    }
                }
            }

            // Update database
            const updateData = category === 'reference'
                ? { reference_photos: updatedPhotos }
                : { healed_photos: updatedPhotos };

            const updateResult = await updateClient(client.id, updateData);
            if (updateResult.success) {
                // Update Redux state
                dispatch(setClient({
                    ...client,
                    ...updateData
                }));

                // Photo removed successfully (no toast needed)
            } else {
                // Database update failed - show error but photo stays removed from UI
                console.error('Database update failed:', updateResult.error);
                toast({
                    title: 'Photo removed but sync failed',
                    description: 'Photo deleted but may reappear on reload.',
                    variant: 'error',
                });
            }
        } catch (error) {
            console.error('Error removing photo:', error);
            // Photo is already removed from UI, show error
            toast({
                title: 'Delete may not be synced',
                description: 'Photo removed from view but deletion may have failed.',
                variant: 'error',
            });
        }
    };

    // Request permissions for image picker
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

    // Pick image from library
    const pickImage = async (category: 'reference' | 'healed') => {
        const closeModal = category === 'reference' ? setReferencePhotoOptionOpen : setHealedPhotoOptionOpen;
        closeModal(false);

        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await handleImageSelected(category, result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            toast({
                title: 'Error',
                description: 'Failed to pick image. Please try again.',
                variant: 'error',
            });
        }
    };

    // Take photo with camera
    const takePhoto = async (category: 'reference' | 'healed') => {
        const closeModal = category === 'reference' ? setReferencePhotoOptionOpen : setHealedPhotoOptionOpen;
        closeModal(false);

        const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            toast({
                title: 'Permission Required',
                description: 'Sorry, we need camera permissions to make this work!',
                variant: 'error',
            });
            return;
        }

        try {
            const result = await ExpoImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await handleImageSelected(category, result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            toast({
                title: 'Error',
                description: 'Failed to take photo. Please try again.',
                variant: 'error',
            });
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
                                    {loading ? (
                                        <View className="items-center justify-center" style={{ height: 200 }}>
                                            <ActivityIndicator size="large" />
                                            <Text className="mt-4 text-text-secondary">Loading your appointments...</Text>
                                        </View>
                                    ) : projects.length === 0 ? (
                                        <View className="items-center py-8">
                                            <Text className="text-text-secondary text-center">
                                                No appointments scheduled yet.
                                            </Text>
                                        </View>
                                    ) : (
                                        <View className="gap-6">
                                            {projects.map((project) => (
                                                <View key={project.id} className="gap-2">
                                                    <Pressable
                                                        className="flex-row items-center justify-between gap-2"
                                                        onPress={() => toggleProject(project.id)}
                                                    >
                                                        <View className="flex-row items-center gap-2">
                                                            <View className="h-2 w-2 rounded-full bg-foreground"></View>
                                                            <Text variant="h4">{project.title} —</Text>
                                                        </View>
                                                        <Icon as={expandedProjects[project.id] ? ChevronUp : ChevronDown} strokeWidth={1} size={32} />
                                                    </Pressable>
                                                    {expandedProjects[project.id] && (
                                                        <View className="flex-row w-full justify-between">
                                                            <View className="gap-5">
                                                                {project.sessions && project.sessions.length > 0 ? (
                                                                    project.sessions
                                                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                                        .map((session) => (
                                                                            <View key={session.id} className="gap-1">
                                                                                <Text variant="h5">{formatDate(session.date)}</Text>
                                                                                <Text className="text-text-secondary leading-none">
                                                                                    {formatTimeRange(session.start_time, session.duration)}
                                                                                </Text>
                                                                                {artist?.studio_name && (
                                                                                    <Text className="text-text-secondary leading-none">
                                                                                        {artist.studio_name}
                                                                                    </Text>
                                                                                )}
                                                                            </View>
                                                                        ))
                                                                ) : (
                                                                    <View className="gap-1">
                                                                        <Text className="text-text-secondary">No sessions scheduled yet</Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                            <View className="w-[120px] gap-2">
                                                                {project.drawing && project.drawing.length > 0 ? (
                                                                    project.drawing
                                                                        .filter(drawing => drawing.image_url)
                                                                        .slice(0, 1)
                                                                        .map((drawing) => (
                                                                            <Pressable key={drawing.id} onPress={() => handleImagePress({ uri: drawing.image_url })}>
                                                                                <Image
                                                                                    source={{ uri: drawing.image_url }}
                                                                                    style={{ width: "100%", height: 60, borderRadius: 5 }}
                                                                                    resizeMode="cover"
                                                                                />
                                                                            </Pressable>
                                                                        ))
                                                                ) : (
                                                                    <Image
                                                                        source={require('@/assets/images/tattoos/tattoos_17.png')}
                                                                        style={{ width: "100%", height: 60, borderRadius: 5 }}
                                                                    />
                                                                )}
                                                                <Text className="text-text-secondary leading-none text-center" style={{ fontSize: 10 }}>
                                                                    {project.status}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                        <View className="gap-4">
                                            <View className="w-full gap-2">
                                                <Button variant="outline" onPress={handleReschedule}>
                                                    <Text>Reschedule/Cancel</Text>
                                                </Button>
                                            </View>
                                            <View className="w-full gap-2">
                                                <Button variant="outline" onPress={() => router.push('/client/appointments/cancel-list' as RelativePathString)}>
                                                    <Text>Join Cancellation List</Text>
                                                </Button>
                                                <Text className="text-text-secondary leading-none text-center text-xs">Want an earlier spot? Join the list for a chance to move up</Text>
                                            </View>
                                            <View className="w-full gap-2">
                                                <Button variant="outline" onPress={() => router.push('/client/appointments/booking-form' as RelativePathString)}>
                                                    <Text>Book A New Project</Text>
                                                </Button>
                                            </View>
                                        </View>
                                        {projects.length > 0 && artist?.rule?.waiver_text && (
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
                                                        <View style={{ width: 48, height: 19 }} className={`border items-center justify-center rounded-full px-1 ${
                                                            projects.every(p => p.waiver_signed) ? 'border-green' : 'border-orange'
                                                        }`}>
                                                            <Text className={`text-xs ${
                                                                projects.every(p => p.waiver_signed) ? 'text-green' : 'text-orange'
                                                            }`} style={{ fontSize: 10 }}>
                                                                {projects.every(p => p.waiver_signed) ? 'Signed' : 'Pending'}
                                                            </Text>
                                                        </View>
                                                        <Text variant="small">Tattoo_Agreement.pdf</Text>
                                                        <View className="flex-row items-center gap-1">
                                                            <Text variant="small">Preview</Text>
                                                            <Icon as={FileSearch} strokeWidth={2} size={16} />
                                                        </View>
                                                    </View>
                                                </View>
                                                <Text className="text-text-secondary text-sm tracking-wide">If the waiver isn't signed you'll see it here. It's also emailed to you.</Text>
                                            </View>
                                        )}
                                        <View className="gap-4">
                                            <View className="flex-row items-center justify-start gap-4">
                                                <Text variant="h5">Reference Photo Uploads</Text>
                                                <Pressable onPress={() => setReferencePhotoOptionOpen(true)} disabled={uploadingReference}>
                                                    <Image source={require('@/assets/images/icons/camera.png')} style={{ width: 32, height: 32 }} />
                                                </Pressable>
                                            </View>
                                            {referencePhotos.length > 0 && (
                                                <View className="flex-row flex-wrap justify-start gap-x-2 gap-y-4">
                                                    {referencePhotos.map((photoUrl, index) => (
                                                        <View key={index} className="items-start" style={{ width: '31%' }}>
                                                            <View className="relative" style={{ width: 100 }}>
                                                                <Pressable onPress={() => handleImagePress(photoUrl)}>
                                                                    <Image
                                                                        source={{ uri: photoUrl }}
                                                                        style={{ width: '100%', height: 100, borderRadius: 10 }}
                                                                        resizeMode="cover"
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
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                        <View className="gap-4">
                                            <View className="flex-row items-center justify-start gap-4">
                                                <Text variant="h5">Healed Photo Upload</Text>
                                                <Pressable onPress={() => setHealedPhotoOptionOpen(true)} disabled={uploadingHealed}>
                                                    <Image source={require('@/assets/images/icons/camera.png')} style={{ width: 32, height: 32 }} />
                                                </Pressable>
                                            </View>
                                            {healedPhotos.length > 0 && (
                                                <View className="flex-row flex-wrap justify-start gap-x-2 gap-y-4">
                                                    {healedPhotos.map((photoUrl, index) => (
                                                        <View key={index} className="items-start" style={{ width: '31%' }}>
                                                            <View className="relative" style={{ width: 100 }}>
                                                                <Pressable onPress={() => handleImagePress(photoUrl)}>
                                                                    <Image
                                                                        source={{ uri: photoUrl }}
                                                                        style={{ width: '100%', height: 100, borderRadius: 10 }}
                                                                        resizeMode="cover"
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
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                            </ScrollView>
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

                {/* Reference Photo Upload Modal */}
                <Modal
                    visible={referencePhotoOptionOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setReferencePhotoOptionOpen(false)}
                >
                    <View className="flex-1 justify-center p-4">
                        <Pressable
                            className="absolute inset-0 bg-black/50"
                            onPress={() => setReferencePhotoOptionOpen(false)}
                        />
                        <View className="bg-background-secondary p-4 rounded-2xl">
                            <View className="mb-2">
                                <Text className="text-lg font-semibold">Add Reference Photo</Text>
                                <Text className="text-text-secondary mt-1">Choose how you want to add a photo</Text>
                            </View>
                            <View className='flex-row gap-2 items-center justify-center'>
                                <Button onPress={() => takePhoto('reference')} disabled={uploadingReference}>
                                    <Text>{uploadingReference ? 'Uploading...' : 'Camera'}</Text>
                                </Button>
                                <Button onPress={() => pickImage('reference')} disabled={uploadingReference}>
                                    <Text>{uploadingReference ? 'Uploading...' : 'Photo Library'}</Text>
                                </Button>
                                <Button onPress={() => setReferencePhotoOptionOpen(false)} variant='outline'>
                                    <Text>Cancel</Text>
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Healed Photo Upload Modal */}
                <Modal
                    visible={healedPhotoOptionOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setHealedPhotoOptionOpen(false)}
                >
                    <View className="flex-1 justify-center p-4">
                        <Pressable
                            className="absolute inset-0 bg-black/50"
                            onPress={() => setHealedPhotoOptionOpen(false)}
                        />
                        <View className="bg-background-secondary p-4 rounded-2xl">
                            <View className="mb-2">
                                <Text className="text-lg font-semibold">Add Healed Photo</Text>
                                <Text className="text-text-secondary mt-1">Choose how you want to add a photo</Text>
                            </View>
                            <View className='flex-row gap-2 items-center justify-center'>
                                <Button onPress={() => takePhoto('healed')} disabled={uploadingHealed}>
                                    <Text>{uploadingHealed ? 'Uploading...' : 'Camera'}</Text>
                                </Button>
                                <Button onPress={() => pickImage('healed')} disabled={uploadingHealed}>
                                    <Text>{uploadingHealed ? 'Uploading...' : 'Photo Library'}</Text>
                                </Button>
                                <Button onPress={() => setHealedPhotoOptionOpen(false)} variant='outline'>
                                    <Text>Cancel</Text>
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </>
    )
}