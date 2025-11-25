import { useState, useRef } from "react";
import { View, Pressable, Image, Linking, Modal, Dimensions } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/lib/time-picker';
import { useToast } from "@/lib/contexts/toast-context";
import { DurationPicker } from "@/components/lib/duration-picker";
import { useAuth } from '@/lib/contexts/auth-context';
import { createEventBlockTime } from '@/lib/services/calendar-service';
import { convertTimeToISOString, convertTimeToHHMMString, parseYmdFromDb } from "@/lib/utils";
import { Collapse } from "@/components/lib/collapse";
import { uploadFileToStorage } from '@/lib/services/storage-service';

import X_IMAGE from "@/assets/images/icons/x.png";
import APPOINTMENT_IMAGE from "@/assets/images/icons/appointment.png";
import { TimeDurationPicker } from "@/components/lib/time-duration-picker";
import { Icon } from "@/components/ui/icon";
import { FileText, FileSearch, X } from "lucide-react-native";
import { Checkbox } from "@/components/ui/checkbox";

type QuickAppointmentData = {
    fullName: string;
    email: string;
    phoneNumber?: string;
    date: string;
    startTime: string;
    sessionLength: string;
    notes: string;
    waiverSigned: boolean;
    waiverUrl?: string;
};

export default function QuickAppointmentAddPage() {
    const { toast } = useToast();
    const { artist } = useAuth();
    const [loading, setLoading] = useState(false);
    const { date } = useLocalSearchParams<{ date?: string }>();
    const getFileNameFromUrl = (inputUrl: string): string => {
        if (!inputUrl) return '';
        const withoutQuery = inputUrl.split('?')[0];
        const rawName = withoutQuery.split('/').pop() || '';
        try {
            return decodeURIComponent(rawName);
        } catch {
            return rawName;
        }
    };

    const waiverUrl = artist?.rule?.waiver_text || '';
    const waiverFileName = waiverUrl ? getFileNameFromUrl(waiverUrl) : '';

    const [formData, setFormData] = useState<QuickAppointmentData>({
        fullName: '',
        email: '',
        phoneNumber: '',
        date: '',
        startTime: '',
        sessionLength: '',
        notes: '',
        waiverSigned: false,
    });

    // Waiver signing UI state
    const [waiverModalVisible, setWaiverModalVisible] = useState(false);
    const [agreeTermsChecked, setAgreeTermsChecked] = useState<boolean>(false);
    const [agreePrivacyChecked, setAgreePrivacyChecked] = useState<boolean>(false);
    const [legalName, setLegalName] = useState<string>('');
    const [initials, setInitials] = useState<string>('');
    const [birthdate, setBirthdate] = useState<string>('');
    const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const waiverImageRef = useRef<View>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

    const isImageUri = (uri?: string): boolean => {
        if (!uri) return false;
        const url = uri.split('?')[0].toLowerCase();
        return (
            url.endsWith('.jpg') ||
            url.endsWith('.jpeg') ||
            url.endsWith('.png') ||
            url.endsWith('.gif') ||
            url.endsWith('.webp') ||
            url.endsWith('.bmp')
        );
    };

    const handleOpenWaiver = () => {
        if (!waiverUrl) return;
        setAgreeTermsChecked(false);
        setAgreePrivacyChecked(false);
        setLegalName('');
        setInitials('');
        setBirthdate('');
        setWaiverModalVisible(true);
    };

    const handlePreviewWaiver = async () => {
        if (!waiverUrl) return;
        try {
            await Linking.openURL(waiverUrl);
        } catch { /* noop */ }
    };

    const handleOpenTerms = async () => {
        const termsUrl = artist?.rule?.terms_of_condition || '';
        if (!termsUrl) return;
        try {
            await Linking.openURL(termsUrl);
        } catch { /* noop */ }
    };

    const handleOpenPrivacy = async () => {
        const privacyUrl = artist?.rule?.privacy_policy || '';
        if (!privacyUrl) return;
        try {
            await Linking.openURL(privacyUrl);
        } catch { /* noop */ }
    };

    const handleImagePress = (source: any) => {
        setSelectedImageSource(source);
        setIsImageViewerVisible(true);
    };

    const handleCloseImageViewer = () => {
        setIsImageViewerVisible(false);
        setSelectedImageSource(null);
    };

    const canSign =
        !!waiverUrl &&
        !!legalName.trim() &&
        !!initials.trim() &&
        !!birthdate.trim() &&
        agreeTermsChecked &&
        agreePrivacyChecked;

    const generateSignedWaiver = async (): Promise<string | null> => {
        if (!waiverUrl || !artist?.id) return null;

        try {
            // For PDFs, we'll need a different approach (convert to image or use PDF library)
            // For now, handle images
            if (!isImageUri(waiverUrl)) {
                toast({ 
                    variant: 'info', 
                    title: 'PDF signing', 
                    description: 'PDF signing requires backend processing. Using original file with metadata.',
                    duration: 3000 
                });
                // For PDFs, return null to use original URL with metadata
                return null;
            }

            // Wait for image dimensions to be loaded
            let attempts = 0;
            while (!imageDimensions && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            if (!imageDimensions) {
                // Fallback to default dimensions
                setImageDimensions({ width: 800, height: 1000 });
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            if (!waiverImageRef.current) {
                throw new Error('Waiver image view not ready');
            }

            // Wait a bit more to ensure the view is fully rendered
            await new Promise(resolve => setTimeout(resolve, 300));

            // Capture the view with text overlay
            const uri = await captureRef(waiverImageRef.current, {
                format: 'jpg',
                quality: 0.9,
            });

            // Create filename with signature info
            const signatureDate = new Date().toISOString().split('T')[0];
            const sanitizedName = legalName.trim().replace(/[^a-zA-Z0-9]/g, '_');
            const signedFileName = `signed_waiver_${Date.now()}_${sanitizedName}.jpg`;

            // Upload the signed image
            const uploadResult = await uploadFileToStorage(
                {
                    uri,
                    name: signedFileName,
                    type: 'image/jpeg',
                    size: 0,
                },
                'artist-waivers',
                artist.id
            );

            // Clean up temporary file
            try {
                await FileSystem.deleteAsync(uri, { idempotent: true });
            } catch (e) {
                console.warn('Could not delete temporary file:', e);
            }

            if (uploadResult.success && uploadResult.url) {
                return uploadResult.url;
            }

            return null;
        } catch (error) {
            console.error('Error generating signed waiver:', error);
            return null;
        }
    };

    const handleSignWaiver = async () => {
        if (!artist?.id) {
            toast({ variant: 'error', title: 'Not authenticated', duration: 2500 });
            return;
        }

        try {
            setLoading(true);

            // Generate signed waiver image
            const signedWaiverUrl = await generateSignedWaiver();
            
            // Use signed URL if available, otherwise use original
            const finalWaiverUrl = signedWaiverUrl || waiverUrl;

            // Save to form data
            setFormData((prev) => ({ 
                ...prev, 
                waiverSigned: true, 
                waiverUrl: finalWaiverUrl 
            }));

            setWaiverModalVisible(false);
            
            toast({ 
                variant: 'success', 
                title: 'Waiver signed', 
                description: signedWaiverUrl ? 'Signed version created successfully.' : 'Signature saved.',
                duration: 3000 
            });
        } catch (error) {
            console.error('Error signing waiver:', error);
            toast({ 
                variant: 'error', 
                title: 'Signing failed', 
                description: 'Could not create signed version. Please try again.',
                duration: 3000 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleSave = async () => {
        // Basic validations (mirror off-days add flow)
        if (!artist?.id) {
            toast({ variant: 'error', title: 'Not authenticated', duration: 2500 });
            return;
        }
        if (!formData.fullName?.trim()) {
            toast({ variant: 'error', title: 'Full name is required', duration: 2500 });
            return;
        }
        if (!formData.email?.trim()) {
            toast({ variant: 'error', title: 'Email is required', duration: 2500 });
            return;
        }
        if (!formData.date?.trim()) {
            toast({ variant: 'error', title: 'Date is required', duration: 2500 });
            return;
        }
        if (!formData.startTime?.trim()) {
            toast({ variant: 'error', title: 'Start time is required', duration: 2500 });
            return;
        }
        if (!formData.sessionLength?.trim()) {
            toast({ variant: 'error', title: 'Session length is required', duration: 2500 });
            return;
        }
        // Optional: ensure end time is after start time


        // Derive YYYY-MM-DD directly from the input without timezone conversions
        const dateStr = (() => {
            const pad = (n: number) => String(n).padStart(2, '0');
            if (date) {
                try {
                    const d = parseYmdFromDb(String(date));
                    if (!isNaN(d.getTime())) {
                        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                    }
                } catch { /* noop */ }
                // Fallback: if string starts with YYYY-MM-DD, take that portion
                const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date));
                if (m) return `${m[1]}-${m[2]}-${m[3]}`;
            }
            const now = new Date();
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        })();

        // try {
        //     setLoading(true);
        //     const result = await createEventBlockTime({
        //         artistId: artist.id,
        //         date: dateStr,
        //         title: formData.title.trim(),
        //         startTime: formData.startTime,
        //         endTime: formData.endTime,
        //         repeatable: formData.isRepeat,
        //         repeatType: formData.isRepeat ? formData.repeatType : undefined,
        //         repeatDuration: formData.isRepeat ? (formData.repeatDuration?.value ?? 1) : undefined,
        //         repeatDurationUnit: formData.isRepeat
        //             ? (formData.repeatDuration?.unit ?? (formData.repeatType === 'monthly' ? 'months' : 'weeks'))
        //             : undefined,
        //         notes: formData.eventNotes?.trim() || undefined,
        //     });

        //     if (!result.success) {
        //         toast({ variant: 'error', title: result.error || 'Failed to save event', duration: 3000 });
        //         return;
        //     }

        //     toast({ variant: 'success', title: 'New Event Added!', duration: 3000 });
        //     router.dismissTo({ pathname: '/artist/calendar', params: { mode: 'month' } });
        // } catch (e) {
        //     toast({ variant: 'error', title: e instanceof Error ? e.message : 'Unexpected error', duration: 3000 });
        // } finally {
        //     setLoading(false);
        // }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={X_IMAGE}
                    onLeftButtonPress={handleBack}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4 pt-2 pb-8">
                        <KeyboardAwareScrollView
                            bottomOffset={50}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View className="gap-6 pb-6">
                                <View className="items-center justify-center pb-[22px]">
                                    <Image
                                        source={APPOINTMENT_IMAGE}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Add Quick</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">Appointment</Text>
                                    <Text className="text-center mt-2 text-text-secondary max-w-[300px]">Adds to calendar-Toggle deposit “paid” in profile to send dashboard.</Text>
                                </View>

                                {/* Form Fields */}
                                <View className="gap-6">
                                    {/* Event Name */}
                                    <View className="gap-2">
                                        <Text variant="h5">Full Name</Text>
                                        <Input
                                            spellCheck={false}
                                            autoComplete="off"
                                            textContentType="none"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            value={formData.fullName}
                                            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                                            className="w-full"
                                        />
                                    </View>

                                    <View className="gap-2">
                                        <Text variant="h5">Email</Text>
                                        <View className="gap-1">
                                            <Input
                                                spellCheck={false}
                                                autoComplete="off"
                                                textContentType="none"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                value={formData.email}
                                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                                className="w-full"
                                            />
                                            <Text className="text-text-secondary text-sm">Aftercare link will be automatically emailed</Text>
                                        </View>
                                    </View>

                                    <View className="gap-2">
                                        <Text variant="h5">Phone Number</Text>
                                        <Input
                                            spellCheck={false}
                                            autoComplete="off"
                                            textContentType="none"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            value={formData.phoneNumber}
                                            onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                                            className="w-full"
                                        />
                                    </View>

                                    <View className="gap-6">
                                        <View className="items-start gap-2">
                                            <Collapse title="Start Time" textClassName="text-xl">
                                                <View className="gap-2 w-full">
                                                    <TimePicker
                                                        minuteInterval={15}
                                                        className="w-full"
                                                        selectedTime={formData.startTime ? convertTimeToISOString(formData.startTime) : undefined}
                                                        onTimeSelect={(time) => setFormData({ ...formData, startTime: convertTimeToHHMMString(time) })}
                                                    />
                                                </View>
                                            </Collapse>
                                        </View>
                                        <View className="items-start gap-2">
                                            <Collapse title="Session length" textClassName="text-xl">
                                                <View className="gap-2 w-full">
                                                    <TimeDurationPicker
                                                        selectedDuration={formData.sessionLength ? parseInt(formData.sessionLength) : undefined}
                                                        onDurationSelect={(duration) => setFormData({ ...formData, sessionLength: String(duration) })}
                                                        minuteInterval={15}
                                                        minDuration={15}
                                                        maxDuration={240}
                                                        modalTitle="Select Session Duration"
                                                    />
                                                </View>
                                            </Collapse>
                                        </View>
                                    </View>

                                    <View className="gap-2">
                                        <Text variant="h5">Notes</Text>
                                        <Textarea
                                            placeholder="Add project notes & location here"
                                            className="min-h-28"
                                            value={formData.notes}
                                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                                        />
                                    </View>

                                    <View className="gap-1">
                                        <Text variant="h4">Sign Waiver</Text>
                                        <Text className="text-text-secondary">Save now, sign later</Text>
                                    </View>

                                    <Pressable
                                        className="flex-row gap-2 bg-background-secondary p-4 rounded-lg border border-border"
                                        onPress={() => {
                                            if (!waiverUrl) return;
                                            if (formData.waiverSigned) {
                                                if (isImageUri(waiverUrl)) {
                                                    handleImagePress({ uri: waiverUrl });
                                                } else {
                                                    handlePreviewWaiver();
                                                }
                                            } else {
                                                handleOpenWaiver();
                                            }
                                        }}
                                    >
                                        <View className="h-12 w-12 rounded-full bg-foreground items-center justify-center">
                                            <Icon as={FileText} strokeWidth={2} size={24} className="text-background" />
                                        </View>
                                        <View className="gap-2 flex-1">
                                            <View style={{ width: formData.waiverSigned ? 50 : 70 }} className={`border items-center justify-center rounded-full px-1 ${formData.waiverSigned ? 'border-green bg-green/10' : 'border-destructive bg-destructive/10'}`}>
                                                <Text className={`text-xs items-center justify-center ${formData.waiverSigned ? 'text-green' : 'text-destructive'}`} style={{ fontSize: 10 }}>{formData.waiverSigned ? 'Signed' : 'Not Signed'}</Text>
                                            </View>
                                            <Text variant="small">{waiverFileName || 'No waiver uploaded'}</Text>
                                            <View className="flex-row items-center gap-1">
                                                <Text variant="small">{formData.waiverSigned ? 'Preview' : 'Preview and Sign'}</Text>
                                                <Icon as={FileSearch} strokeWidth={1} size={16} />
                                            </View>
                                        </View>
                                    </Pressable>
                                </View>

                                <Button onPress={handleSave} size="lg" disabled={loading}>
                                    <Text variant='h5'>{loading ? 'Saving...' : 'Add To Calendar'}</Text>
                                </Button>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper >
            </SafeAreaView >

            {/* Waiver Signing Modal */}
            <Modal
                visible={waiverModalVisible}
                onRequestClose={() => setWaiverModalVisible(false)}
                transparent={true}
                animationType="fade"
            >
                <View className="flex-1 bg-black/50 justify-end items-center">
                    <View style={{ height: screenHeight - 30 }} className="w-full bg-background-secondary rounded-t-3xl p-4 pt-8 pb-8 gap-6">
                        <View className="items-start justify-center relative">
                            <Text variant="h6" className="leading-tight">Waiver Agreement between{'\n'}Artist & Client</Text>
                            <Pressable className="absolute top-0 right-0" onPress={() => setWaiverModalVisible(false)}>
                                <Icon as={X} size={24} />
                            </Pressable>
                        </View>

                        {/* Waiver Preview */}
                        <View className="gap-3 flex-1">
                            {isImageUri(waiverUrl) ? (
                                <>
                                    {/* Hidden view for capturing with text overlay - positioned off-screen but rendered */}
                                    <View 
                                        ref={waiverImageRef}
                                        style={{ 
                                            position: 'absolute',
                                            opacity: 0,
                                            width: imageDimensions?.width || 800, 
                                            height: imageDimensions?.height || 1000,
                                            overflow: 'hidden',
                                        }}
                                        collapsable={false}
                                        pointerEvents="none"
                                    >
                                        <Image
                                            source={{ uri: waiverUrl }}
                                            style={{ 
                                                width: imageDimensions?.width || 800, 
                                                height: imageDimensions?.height || 1000 
                                            }}
                                            resizeMode="cover"
                                        />
                                        {/* Signature overlay text */}
                                        <View 
                                            style={{
                                                position: 'absolute',
                                                bottom: 50,
                                                left: 20,
                                                right: 20,
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                padding: 15,
                                                borderRadius: 8,
                                                borderWidth: 1,
                                                borderColor: '#000',
                                            }}
                                        >
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#000' }}>
                                                Signature Information:
                                            </Text>
                                            <Text style={{ fontSize: 12, marginBottom: 4, color: '#000' }}>
                                                Legal Name: {legalName.trim() || 'N/A'}
                                            </Text>
                                            <Text style={{ fontSize: 12, marginBottom: 4, color: '#000' }}>
                                                Initials: {initials.trim() || 'N/A'}
                                            </Text>
                                            <Text style={{ fontSize: 12, marginBottom: 4, color: '#000' }}>
                                                Birthdate: {birthdate.trim() || 'N/A'}
                                            </Text>
                                            <Text style={{ fontSize: 12, marginTop: 8, fontStyle: 'italic', color: '#000' }}>
                                                Signed on: {new Date().toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Visible preview */}
                                    <Pressable className="w-full h-full" onPress={() => handleImagePress({ uri: waiverUrl })}>
                                        <Image
                                            source={{ uri: waiverUrl }}
                                            style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                            resizeMode="contain"
                                            onLoad={(e) => {
                                                const { width, height } = e.nativeEvent.source;
                                                if (width && height) {
                                                    // Maintain aspect ratio but scale to reasonable size for capture
                                                    const maxWidth = 1200;
                                                    const maxHeight = 1600;
                                                    let finalWidth = width;
                                                    let finalHeight = height;
                                                    
                                                    if (width > maxWidth) {
                                                        const ratio = maxWidth / width;
                                                        finalWidth = maxWidth;
                                                        finalHeight = height * ratio;
                                                    }
                                                    if (finalHeight > maxHeight) {
                                                        const ratio = maxHeight / finalHeight;
                                                        finalHeight = maxHeight;
                                                        finalWidth = finalWidth * ratio;
                                                    }
                                                    
                                                    setImageDimensions({ width: finalWidth, height: finalHeight });
                                                }
                                            }}
                                        />
                                    </Pressable>
                                </>
                            ) : (
                                <Pressable onPress={handlePreviewWaiver} className="gap-4 w-full items-center justify-center bg-background border border-border rounded-lg py-6">
                                    <Icon as={FileSearch} strokeWidth={1} size={32} />
                                    <Text variant="small">Preview</Text>
                                </Pressable>
                            )}
                        </View>

                        {/* Required fields */}
                        <View className="gap-3">
                            <View className="gap-1">
                                <Text variant="small">Legal Full Name</Text>
                                <Input
                                    value={legalName}
                                    onChangeText={setLegalName}
                                    autoCapitalize="words"
                                    className="w-full"
                                />
                            </View>
                            <View className="gap-1">
                                <Text variant="small">Initials</Text>
                                <Input
                                    value={initials}
                                    onChangeText={setInitials}
                                    autoCapitalize="characters"
                                    className="w-full"
                                />
                            </View>
                            <View className="gap-1">
                                <Text variant="small">Birthdate (YYYY-MM-DD)</Text>
                                <Input
                                    value={birthdate}
                                    onChangeText={setBirthdate}
                                    autoCapitalize="none"
                                    className="w-full"
                                />
                            </View>
                        </View>

                        {/* Consents */}
                        <View className="gap-3">
                            <View className="flex-row items-center gap-3">
                                <Checkbox checked={agreeTermsChecked} onCheckedChange={(v) => setAgreeTermsChecked(!!v)} />
                                <View className="flex-1">
                                    <Pressable onPress={handleOpenTerms}>
                                        <Text className="underline">I agree to Artist’s Policies</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <Checkbox checked={agreePrivacyChecked} onCheckedChange={(v) => setAgreePrivacyChecked(!!v)} />
                                <View className="flex-1">
                                    <Pressable onPress={handleOpenPrivacy}>
                                        <Text className="underline">I agree to the Privacy Policy</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>

                        <Button disabled={!canSign || loading} onPress={handleSignWaiver}>
                            <Text className="font-semibold">{loading ? 'Creating signed version...' : 'Sign Waiver'}</Text>
                        </Button>
                    </View>
                </View>
            </Modal>

            {/* Image Viewer */}
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
