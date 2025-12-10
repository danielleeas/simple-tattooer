import { View, Image } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from "expo-router";
import { useState } from "react";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import CustomModal from '@/components/lib/custom-modal';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/contexts/auth-context";
import { useToast } from "@/lib/contexts/toast-context";
import { checkArtistExists } from "@/lib/services/auth-service";
import { createClientWithAuth, checkClientExists, checkClientExistsByPhone } from "@/lib/services/clients-service";

import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import PLUS_THIN_IMAGE from "@/assets/images/icons/plus_thin.png";

export default function AddClient() {

    const { artist } = useAuth();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        project_notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailError, setEmailError] = useState<string>('');
    const [showExistingClientModal, setShowExistingClientModal] = useState(false);
    const [existingClientData, setExistingClientData] = useState<any>(null);

    // Email validation function
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Check if form is valid
    const isFormValid = () => {
        return (
            formData.full_name.trim() !== '' &&
            formData.email.trim() !== '' &&
            validateEmail(formData.email) &&
            formData.phone_number.trim() !== ''
        );
    };

    const handleBack = () => {
        router.back();
    };

    const handleEmailChange = (text: string) => {
        setFormData({ ...formData, email: text });

        // Validate email format
        if (text.trim() && !validateEmail(text)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    const handleCreateClient = async () => {
        if (!formData.full_name.trim() || !formData.email.trim() || !formData.phone_number.trim()) {
            toast({
                variant: 'error',
                title: 'Missing information',
                description: 'Full name, email, and phone number are required.',
            });
            return;
        }

        if (!validateEmail(formData.email)) {
            toast({
                variant: 'error',
                title: 'Invalid email',
                description: 'Please enter a valid email address.',
            });
            return;
        }

        if (!artist?.id) {
            toast({
                variant: 'error',
                title: 'Not ready',
                description: 'Artist session not loaded. Please try again.',
            });
            return;
        }

        try {
            setIsSubmitting(true);

            // Check if an artist exists with the same email
            const artistCheck = await checkArtistExists(formData.email.trim().toLowerCase());
            if (artistCheck.error) {
                toast({
                    variant: 'error',
                    title: 'Error',
                    description: 'Failed to verify email. Please try again.',
                });
                return;
            }
            if (artistCheck.exists) {
                toast({
                    variant: 'error',
                    title: 'Email already exists',
                    description: 'An artist with this email already exists.',
                });
                return;
            }

            // Check if a client exists with the same email
            const clientCheck = await checkClientExists(formData.email.trim());
            if (clientCheck.error) {
                toast({
                    variant: 'error',
                    title: 'Error',
                    description: 'Failed to verify email. Please try again.',
                });
                return;
            }
            if (clientCheck.exists && clientCheck.client) {
                // Show modal to confirm using existing client
                setExistingClientData(clientCheck.client);
                setShowExistingClientModal(true);
                return;
            }

            // Check if a client exists with the same phone number
            const clientPhoneCheck = await checkClientExistsByPhone(formData.phone_number.trim());
            if (clientPhoneCheck.error) {
                toast({
                    variant: 'error',
                    title: 'Error',
                    description: 'Failed to verify phone number. Please try again.',
                });
                return;
            }
            if (clientPhoneCheck.exists && clientPhoneCheck.client) {
                // Show modal to confirm using existing client
                setExistingClientData(clientPhoneCheck.client);
                setShowExistingClientModal(true);
                return;
            }

            const created = await createClientWithAuth({
                full_name: formData.full_name,
                email: formData.email,
                phone_number: formData.phone_number,
                project_notes: formData.project_notes,
                artist_id: artist.id,
            });

            if (!created?.success) {
                toast({
                    variant: 'error',
                    title: 'Failed to create client',
                    description: created?.error || 'Please try again',
                    duration: 3000,
                });
                return;
            }

            const clientId = created.client.id;

            toast({
                variant: 'success',
                title: 'Client created successfully',
                duration: 3000,
            });

            setTimeout(() => {
                router.push({
                    pathname: '/artist/clients/[id]',
                    params: {
                        id: clientId,
                    },
                });
            }, 100);

        }
        catch (error: any) {
            toast({
                variant: 'error',
                title: 'Failed to create client',
                description: error?.message || 'Please try again',
                duration: 3000,
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelExistingClient = () => {
        setShowExistingClientModal(false);
        setExistingClientData(null);
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4">
                        <View className="flex-1">
                            <KeyboardAwareScrollView bottomOffset={50} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                                <View className="gap-6 pb-10">
                                    <View className="items-center justify-center pb-9">
                                        <Image
                                            source={PLUS_THIN_IMAGE}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Add</Text>
                                        <Text variant="h6" className="text-center uppercase leading-none">new Client</Text>
                                        <Text className="text-center text-text-secondary mt-[18px]">{artist?.full_name} Booking Form</Text>
                                    </View>
                                    <View className="gap-2">
                                        <Text variant="h5">Full Name</Text>
                                        <Input
                                            spellCheck={false}
                                            autoComplete="off"
                                            textContentType="none"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            placeholder="Enter full name"
                                            helperText="First and last, please"
                                            value={formData.full_name}
                                            onChangeText={(text) => setFormData({ ...formData, full_name: text })} />
                                    </View>
                                    <View className="gap-2">
                                        <Text variant="h5">Email</Text>
                                        <Input
                                            spellCheck={false}
                                            autoComplete="off"
                                            textContentType="none"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            placeholder="Enter email"
                                            keyboardType="email-address"
                                            value={formData.email}
                                            onChangeText={handleEmailChange}
                                            helperText={emailError}
                                            error={!!emailError}
                                        />
                                    </View>
                                    <View className="gap-2">
                                        <Text variant="h5">Phone Number</Text>
                                        <Input
                                            spellCheck={false}
                                            autoComplete="off"
                                            textContentType="none"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            placeholder="Enter phone number"
                                            value={formData.phone_number}
                                            onChangeText={(text) => setFormData({ ...formData, phone_number: text })} />
                                    </View>
                                    <View className="gap-2">
                                        <Text variant="h5">Project Notes</Text>
                                        <Textarea
                                            spellCheck={false}
                                            autoComplete="off"
                                            textContentType="none"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            placeholder="Enter project notes"
                                            className="min-h-28"
                                            value={formData.project_notes}
                                            onChangeText={(text) => setFormData({ ...formData, project_notes: text })} />
                                    </View>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                        <View className="flex-row gap-3 py-4">
                            <View className="flex-1">
                                <Button variant="outline" onPress={handleBack} disabled={isSubmitting}>
                                    <Text variant='h5'>Cancel</Text>
                                </Button>
                            </View>
                            <View className="flex-1">
                                <Button variant='outline' onPress={handleCreateClient} disabled={!isFormValid() || isSubmitting}>
                                    <Text variant='h5'>{isSubmitting ? 'Saving' : 'Save'}</Text>
                                </Button>
                            </View>
                        </View>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>

            {/* Existing Client Confirmation Modal */}
            <CustomModal
                visible={showExistingClientModal}
                onClose={handleCancelExistingClient}
                variant="center"
                showCloseButton={false}
                closeOnBackdrop={false}
            >
                <View className="px-6 py-6 bg-background-secondary rounded-lg">
                    <View className="items-center gap-4 mb-6">
                        <Text variant="h4" className="text-center">Client Already Exists</Text>
                        <Text className="text-center text-text-secondary">
                            A client with this {existingClientData?.email === formData.email ? 'email' : 'phone number'} already exists.
                        </Text>
                        <View className="mt-2 w-full bg-background rounded-lg p-4">
                            <Text variant="h6" className="mb-2">Existing Client:</Text>
                            <Text className="text-text-secondary">Name: {existingClientData?.full_name}</Text>
                            <Text className="text-text-secondary">Email: {existingClientData?.email}</Text>
                            <Text className="text-text-secondary">Phone: {existingClientData?.phone_number}</Text>
                        </View>
                    </View>
                    <View className="flex-row gap-3">
                        <View className="flex-1">
                            <Button variant="outline" onPress={handleCancelExistingClient}>
                                <Text variant="h5">Close</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </CustomModal>
        </>
    );
}