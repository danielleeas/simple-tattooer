import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, View, Alert } from 'react-native';
import { X } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { LoadingOverlay } from '@/components/lib/loading-overlay';
import { useToast } from '@/lib/contexts/toast-context';

import { setMode } from '@/lib/redux/slices/auth-slice';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { getCurrentArtist, getArtistAppMode } from '@/lib/services/auth-service';
import { updateSubscriptionData } from '@/lib/services/subscribe-service';
import { setSubscribeLoading, setSubscribeCompleted, setSubscribeError } from '@/lib/redux/slices/subscribe-slice';

export default function Subscribe() {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { isLoading } = useAppSelector((state) => state.subscribe);

    const { type } = useLocalSearchParams<{ type?: 'extend' | 'first' }>();

    const isExtending = type === 'extend';
    const pageTitle = isExtending ? 'Extend Subscription' : 'Subscribe';
    const pageSubtitle = isExtending ? 'Renew your Simple Tattooer subscription' : 'Unlock full access to Simple Tattooer';

    const handleBack = () => {
        router.back();
    }

    const handlePurchase = async (subscriptionType: 'monthly' | 'yearly') => {
        try {
            dispatch(setSubscribeLoading(true));

            // Import purchase function (you'll need to install expo-in-app-purchases)
            // const { purchaseItemAsync, IAPResponseCode } = require('expo-in-app-purchases');

            // For now, let's simulate a successful purchase response
            // Replace this with actual purchase logic when you implement IAP
            // Add a small delay to simulate real purchase processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockPurchaseResponse = {
                responseCode: 0, // Success
                results: [{
                    productId: subscriptionType === 'monthly' ? 'monthly_30_usd' : 'yearly_300_usd',
                    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    transactionDate: Date.now(),
                    transactionReceipt: `receipt_${Date.now()}`,
                    subscribeToken: `token_${Date.now()}`,
                }],
                debugMessage: 'Purchase completed successfully',
            };

            if (mockPurchaseResponse.responseCode === 0) {
                // Purchase successful - prepare data
                const subscribeData = {
                    ...mockPurchaseResponse.results[0],
                    subscriptionType,
                };

                // Handle Supabase operations based on purchase type
                const { user } = await getCurrentArtist();

                if (!user) {
                    throw new Error('Artist not authenticated. Please sign in and try again.');
                }

                const supabaseResult = await updateSubscriptionData(user.id, subscribeData);

                if (!supabaseResult.success) {
                    throw new Error(supabaseResult.error || 'Failed to update subscription data');
                }

                try {
                    const newAppMode = await getArtistAppMode(user.id);
                    dispatch(setMode(newAppMode));
                } catch (modeError) {
                    console.warn('Failed to reload app mode after subscription extension:', modeError);
                    // Don't throw error here as subscription was successful
                }

                // Show success message based on type
                const successTitle = isExtending ? 'Subscription Extended!' : 'Purchase Successful!';
                const successDescription = isExtending
                    ? 'Your subscription has been renewed. You now have full access to all features.'
                    : 'Your subscription has been activated. Please complete your account setup.';

                toast({
                    title: successTitle,
                    description: successDescription,
                    variant: 'success',
                    duration: 3000
                });

                // router.dismissAll();

                // // Navigate based on type
                if (isExtending) {
                    // For extensions, go back to main app
                    router.push('/');
                } else {
                    console.log('first-time purchases')
                    // For first-time purchases, go to signup
                    router.push('/artist/wizard');
                }

            } else {
                // Purchase failed
                const errorMessage = mockPurchaseResponse.debugMessage || 'Purchase failed';
                dispatch(setSubscribeError(errorMessage));
                toast({
                    title: 'Purchase Failed',
                    description: errorMessage,
                    variant: 'error',
                    duration: 2000
                });
            }

        } catch (error) {
            console.error('Purchase error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An error occurred during purchase';
            dispatch(setSubscribeError(errorMessage));
            Alert.alert('Error', errorMessage);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <View className='flex-1 relative p-5 gap-6'>
                    {/* <Pressable onPress={handleBack} className='absolute top-4 right-4'>
                        <Icon as={X} size={24} />
                    </Pressable> */}
                    <View className='flex-1 gap-4 justify-center'>
                        <View className='gap-1 mt-2'>
                            <Text variant="h1" className='text-foreground'>{pageTitle}</Text>
                            <Text className='text-text-secondary text-center'>{pageSubtitle}</Text>
                        </View>

                        <View className='rounded-2xl border border-border-white p-5 gap-3'>
                            <Text variant='h5' className='uppercase tracking-widest text-text-secondary text-center'>Monthly</Text>
                            <View className='items-center justify-center'>
                                <Text variant='h2' className='leading-none'>$30</Text>
                                <Text className='text-text-secondary -mt-1'>per month</Text>
                            </View>
                            <Button
                                variant="outline"
                                className='mt-2 w-full'
                                onPress={() => handlePurchase('monthly')}
                                disabled={isLoading}
                            >
                                <Text>{isExtending ? 'Extend Monthly' : 'Subscribe Monthly'}</Text>
                            </Button>
                        </View>

                        <View className='rounded-2xl border border-border-white p-5 gap-3'>
                            <Text variant='h5' className='uppercase tracking-widest text-text-secondary text-center'>Yearly</Text>
                            <View className='items-center justify-center'>
                                <Text variant='h2' className='leading-none'>$300</Text>
                                <Text className='text-text-secondary -mt-1'>per year</Text>
                            </View>
                            <Button
                                variant="outline"
                                className='mt-2 w-full'
                                onPress={() => handlePurchase('yearly')}
                                disabled={isLoading}
                            >
                                <Text>{isExtending ? 'Extend Yearly' : 'Subscribe Yearly'}</Text>
                            </Button>
                        </View>
                    </View>
                </View>

                {/* Loading Overlay */}
                <LoadingOverlay
                    visible={isLoading}
                    className='bg-transparent'
                />
            </SafeAreaView>
        </>
    )
}