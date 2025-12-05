import { router, Stack, RelativePathString, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientHeader from "@/components/lib/client-header";
import * as ExpoImagePicker from 'expo-image-picker';
import { View, Image, Pressable, Modal, Dimensions } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { FileSearch, FileText } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/contexts/toast-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const locations = [
    {
        name: 'Toronto, Canada',
    },
    {
        name: 'Vancouver, Canada',
    },
    {
        name: 'Montreal, Canada',
    },
    {
        name: 'Calgary, Canada',
    },
    {
        name: 'Ottawa, Canada',
    }
]

const coverupOptions = [
    { label: 'Coverup', value: 'coverup' },
    { label: 'Add on', value: 'add_on' },
    { label: 'Between existing tattoos', value: 'between_existing_tattoos' },
]

export default function BookingForm() {
    const params = useLocalSearchParams<{
        flashImage?: string;
        flashName?: string;
        flashPrice?: string;
        modificationMessage?: string;
    }>();
    const client = useSelector((state: RootState) => state.auth.client);
    const artist = useSelector((state: RootState) => state.artist.artist);
    const { toast } = useToast();

    const [fullName, setFullName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [cityCountry, setCityCountry] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [preferredDay, setPreferredDay] = useState<string>('');
    const [tattooIdea, setTattooIdea] = useState<string>('');
    const [isLegalAge, setIsLegalAge] = useState<boolean>(false);
    const [agreesToTerms, setAgreesToTerms] = useState<boolean>(false);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const [coverupOption, setCoverupOption] = useState<string>('');
    // Extract param values to avoid object recreation issues
    const flashImage = params.flashImage;
    const flashName = params.flashName;
    const flashPrice = params.flashPrice;
    const modificationMessage = params.modificationMessage;
    
    // State for photo categories
    const [referencePhotos, setReferencePhotos] = useState<any[]>(() => {
        // Initialize with flash image if provided
        return flashImage ? [{ uri: flashImage }] : [];
    });
    
    // Track if form has been initialized to prevent infinite loops
    const isInitialized = useRef(false);

    // Initialize form with client data and flash params (only once)
    useEffect(() => {
        if (isInitialized.current) return;
        
        // Pre-fill client information from Redux
        if (client) {
            if (client.full_name) setFullName(client.full_name);
            if (client.email) setEmail(client.email);
            if (client.phone_number) setPhoneNumber(client.phone_number);
            if (client.location) setCityCountry(client.location);
        }

        // Pre-fill flash data if coming from claim modal
        if (flashImage) {
            // Build tattoo idea text
            let ideaText = '';
            // if (flashName) {
            //     ideaText = `Claiming: ${flashName}`; 
            // }
            // if (flashPrice) {
            //     ideaText += ` ($${flashPrice})`;
            // }
            if (modificationMessage) {
                ideaText += modificationMessage;
            }
            if (ideaText) {
                setTattooIdea(ideaText);
            }
        }
        
        isInitialized.current = true;
    }, []); // Empty dependency array - only run once on mount

    const handleBack = () => {
        router.back();
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!fullName.trim()) {
            errors.fullName = 'Full name is required';
        }
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Please enter a valid email address';
        }
        if (!location) {
            errors.location = 'Tattoo booking location is required';
        }
        if (!tattooIdea.trim()) {
            errors.tattooIdea = 'Tattoo idea is required';
        }
        if (!coverupOption) {
            errors.coverupOption = 'Please select coverup/add on/between option';
        }
        if (!isLegalAge) {
            errors.isLegalAge = 'You must confirm you are of legal age';
        }
        if (!agreesToTerms) {
            errors.agreesToTerms = 'You must agree to the Terms & Conditions and Privacy Policy';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleContinue = async () => {
        // Validate form
        if (!validateForm()) {
            toast({
                variant: 'error',
                title: 'Validation Error',
                description: 'Please fill in all required fields',
            });
            return;
        }

        if (!artist?.id) {
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Artist information not found',
            });
            return;
        }

        // Find location_id from artist's locations
        const selectedLocation = artist.locations?.find(
            (loc: any) => loc.address === location || loc.name === location
        );
        
        if (!selectedLocation?.id) {
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Selected location not found',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert reference photos to array of URIs
            const photos = referencePhotos.map((photo) => {
                if (typeof photo === 'string') {
                    return photo;
                }
                if (photo?.uri) {
                    return photo.uri;
                }
                return null;
            }).filter(Boolean) as string[];

            // Convert prefer_days to lowercase
            const preferDays = preferredDay.toLowerCase() || 'any';

            // Convert coverupOption to type_of_tattoo format
            const typeOfTattoo = coverupOption || '';

            // Prepare booking request data
            const bookingRequestData = {
                artist_id: artist.id,
                full_name: fullName.trim(),
                email: email.trim(),
                phone_number: phoneNumber.trim() || null,
                location_id: selectedLocation.id,
                prefer_days: preferDays,
                tattoo_idea: tattooIdea.trim(),
                type_of_tattoo: typeOfTattoo,
                photos: photos,
                status: 'pending',
            };

            // Insert into booking_requests table
            const { data, error } = await supabase
                .from('booking_requests')
                .insert([bookingRequestData])
                .select()
                .single();

            if (error) {
                console.error('Error saving booking request:', error);
                toast({
                    variant: 'error',
                    title: 'Error',
                    description: error.message || 'Failed to submit booking request',
                });
                setIsSubmitting(false);
                return;
            }

            // Success
            toast({
                variant: 'success',
                title: 'Success',
                description: 'Booking request submitted successfully',
            });

            // Navigate to appointments page
            router.push('/client/appointments' as RelativePathString);
        } catch (error: any) {
            console.error('Unexpected error:', error);
            toast({
                variant: 'error',
                title: 'Error',
                description: error.message || 'An unexpected error occurred',
            });
        } finally {
            setIsSubmitting(false);
        }
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
    const handleImageSelected = (category: 'reference', imageSource: string | any) => {
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
        }
    };

    // Handle image removal for different categories
    const handleImageRemoved = (category: 'reference' | 'session' | 'healed', index: number) => {
        switch (category) {
            case 'reference':
                setReferencePhotos(prev => prev.filter((_, i) => i !== index));
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
                <View className="flex-1 pt-2 pb-4 gap-6">
                    <View className="flex-1">
                        <KeyboardAwareScrollView bottomOffset={50} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                            <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                                <View className="items-center justify-center" style={{ height: 180 }}>
                                    <Image
                                        source={require('@/assets/images/icons/portfolio.png')}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">[Artist name] —</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Booking Form</Text>
                                    <Text className="text-center mt-2 text-text-secondary">I’m  happy you’re here!  Please fill out this</Text>
                                    <Text className="text-center text-text-secondary leading-none">short form so we can get  started.</Text>
                                </View>

                                {/* <Button variant="outline">
                                    <Text>Edit Booking/Consult Form</Text>
                                </Button> */}

                                <View className="gap-2">
                                    <Text variant="h5">Full Name</Text>
                                    <Input value={fullName} onChangeText={setFullName} />
                                    {validationErrors.fullName && (
                                        <Text className="text-red-500 text-sm">{validationErrors.fullName}</Text>
                                    )}
                                    <Text className="text-text-secondary">First and last, please</Text>
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Email</Text>
                                    <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                                    {validationErrors.email && (
                                        <Text className="text-red-500 text-sm">{validationErrors.email}</Text>
                                    )}
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Phone Number</Text>
                                    <Input value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">City & Country of Residence</Text>
                                    <Input value={cityCountry} onChangeText={setCityCountry} />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Tattoo Booking Location</Text>
                                    <DropdownPicker
                                        options={artist?.locations?.map((loc: any) => ({
                                            label: loc.address || loc.name || '',
                                            value: loc.address || loc.name || '',
                                        })) || locations.map((location: { name: string }) => ({ label: location.name, value: location.name }))}
                                        value={location}
                                        onValueChange={setLocation}
                                        placeholder="Select location"
                                        modalTitle="Select Location"
                                    />
                                    {validationErrors.location && (
                                        <Text className="text-red-500 text-sm">{validationErrors.location}</Text>
                                    )}
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Preferred days</Text>
                                    <RadioGroup value={preferredDay} onValueChange={(value) => setPreferredDay(value)}>
                                        <View className="flex-row items-center gap-2">
                                            <RadioGroupItem value="Any" id="monday" />
                                            <Text onPress={() => setPreferredDay('Any')}>Any</Text>
                                        </View>
                                        <View className="flex-row items-center gap-2">
                                            <RadioGroupItem value="Weekdays" id="tuesday" />
                                            <Text onPress={() => setPreferredDay('Weekdays')}>Weekdays</Text>
                                        </View>
                                        <View className="flex-row items-center gap-2">
                                            <RadioGroupItem value="Weekend" id="wednesday" />
                                            <Text onPress={() => setPreferredDay('Weekend')}>Weekend</Text>
                                        </View>
                                    </RadioGroup>
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Please Tell Me Your Tattoo Idea</Text>
                                    <Textarea
                                        className="min-h-28"
                                        placeholder="Please include size, placement,  colour, or black & grey."
                                        value={tattooIdea}
                                        onChangeText={setTattooIdea}
                                    />
                                    {validationErrors.tattooIdea && (
                                        <Text className="text-red-500 text-sm">{validationErrors.tattooIdea}</Text>
                                    )}
                                </View>

                                {/* <View className="gap-2">
                                    <Text variant="h5">Anything else I need to know?</Text>
                                    <Textarea className="min-h-28" />
                                </View> */}

                                <View className="gap-2">
                                    <Text variant="h5">Is this a coverup/add on/or between existing tattoos (please include photo)</Text>
                                    <DropdownPicker
                                        options={coverupOptions.map((option: { label: string; value: string }) => ({ label: option.label, value: option.value }))}
                                        value={coverupOption}
                                        onValueChange={(value: string) => setCoverupOption(value)}
                                        placeholder="Select option"
                                        modalTitle="Select Option"
                                    />
                                    {validationErrors.coverupOption && (
                                        <Text className="text-red-500 text-sm">{validationErrors.coverupOption}</Text>
                                    )}
                                </View>
                                
                                <View className="gap-4">
                                    <View className="flex-row items-center justify-start gap-2">
                                        <Text variant="h5">Upload Reference Photos (Max 3)</Text>
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

                                {/* <View className="gap-2">
                                    <Text variant="h5">Question 1</Text>
                                    <Textarea className="min-h-28" placeholder="Type your question here" />
                                </View>

                                <View className="gap-2">
                                    <Text variant="h5">Question 2</Text>
                                    <Textarea className="min-h-28" placeholder="Type your question here" />
                                </View> */}

                                <View className="gap-4">
                                    {/* <View className="flex flex-row items-start gap-3">
                                        <Checkbox
                                            id="terms"
                                            className="mt-1"
                                            checked={isDepositNonRefundable}
                                            onCheckedChange={(checked) => setIsDepositNonRefundable(checked)}
                                        />
                                        <Text
                                            className='flex-1 tracking-wider'
                                            onPress={() => setIsDepositNonRefundable(!isDepositNonRefundable)}
                                        >
                                            I understand that deposits are non - refundable.
                                        </Text>
                                    </View> */}

                                    <View className="flex flex-row items-start gap-3">
                                        <Checkbox
                                            id="legal-age"
                                            className="mt-1"
                                            checked={isLegalAge}
                                            onCheckedChange={(checked) => setIsLegalAge(checked as boolean)}
                                        />
                                        <Text
                                            className='flex-1 tracking-wider'
                                            onPress={() => setIsLegalAge(!isLegalAge)}
                                        >
                                            I am of legal age to get tattooed
                                        </Text>
                                    </View>
                                    {validationErrors.isLegalAge && (
                                        <Text className="text-red-500 text-sm ml-8">{validationErrors.isLegalAge}</Text>
                                    )}

                                    <View className="flex flex-row items-start gap-3">
                                        <Checkbox
                                            id="terms"
                                            className="mt-1"
                                            checked={agreesToTerms}
                                            onCheckedChange={(checked) => setAgreesToTerms(checked as boolean)}
                                        />
                                        <Text
                                            className='flex-1 tracking-wider'
                                            onPress={() => setAgreesToTerms(!agreesToTerms)}
                                        >
                                            I agree to the studio's Terms & Conditions and Privacy Policy.
                                        </Text>
                                    </View>
                                    {validationErrors.agreesToTerms && (
                                        <Text className="text-red-500 text-sm ml-8">{validationErrors.agreesToTerms}</Text>
                                    )}
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                    <View className="gap-4 items-center justify-center px-4">
                        <Button size="lg" className="w-full" onPress={handleContinue} disabled={isSubmitting}>
                            <Text>{isSubmitting ? 'Submitting...' : 'Looks Good — Continue'}</Text>
                        </Button>
                    </View>
                </View>

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