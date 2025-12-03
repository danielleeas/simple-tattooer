import React, { useState } from 'react';
import { router } from 'expo-router';
import { View, Alert } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/lib/contexts/toast-context';
import { useAppDispatch } from '@/lib/redux/hooks';
import { saveSetupWizard, sendWelcomeEmail } from '@/lib/services/setup-wizard-service';
import { LoadingOverlay } from '@/components/lib/loading-overlay';
import { fetchUpdatedArtistProfile } from '@/lib/redux/slices/auth-slice';
import { BASE_URL } from '@/lib/constants';
import { buildFullBookingLink } from '@/lib/utils';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardNavigation({ currentStep, totalSteps }: WizardNavigationProps) {
  const {
    incrementStepNumber,
    decrementStepNumber,
    details,
    branding,
    calendar,
    deposit,
    bookingRules,
    drawingRules,
    cancellationList,
    paymentMethod,
    waiverUpload,
    isSaving,
    setIsSaving
  } = useSetupWizard();
  const { artist } = useAuth();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [saveProgress, setSaveProgress] = useState<number>(0);
  const [saveMessage, setSaveMessage] = useState<string>('Starting...');

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps;

  // const canGoNext = !isLastStep && validation.isValid;
  const canGoNext = !isLastStep;
  const canGoPrevious = !isFirstStep;

  const handleNext = () => {
    if (canGoNext) {
      console.log('calendar', calendar.consultation.dailyStartTimes);
      incrementStepNumber();
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      decrementStepNumber();
    }
  };

  const handleFinish = async () => {
    if (!artist?.id) {
      Alert.alert('Error', 'Artist ID not found. Please try again.');
      return;
    }

    setIsSaving(true);
    setSaveProgress(0);
    setSaveMessage('Starting...');

    try {
      await saveSetupWizard(
        artist.id,
        {
          details,
          branding,
          calendar,
          deposit,
          bookingRules,
          drawingRules,
          cancellationList,
          paymentMethod,
          waiverUpload,
        },
        (p, label) => {
          if (typeof p === 'number') setSaveProgress(p);
          if (label) setSaveMessage(label);
        }
      );

      setSaveProgress(0.99);
      setSaveMessage("Fetching Updated Data");
      await dispatch(fetchUpdatedArtistProfile(artist.id));

      const fullBookingLink = buildFullBookingLink(BASE_URL, details.bookingLinkSuffix);
      await sendWelcomeEmail(artist, details.name, fullBookingLink);

      toast({
        title: 'Welcome aboard!',
        description: 'You are now ready to explore the app and connect with clients.',
        variant: 'success',
        duration: 3000,
      });

      router.push('/');
    } catch (error) {
      console.error('Error completing setup:', error);

      toast({
        title: 'Error',
        description: 'Failed to complete setup. Please try again.',
        variant: 'error',
        duration: 2000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="px-4 pb-8 pt-4 bg-background">
      <LoadingOverlay
        visible={isSaving}
        title="Setting up your profile"
        subtitle={saveMessage}
        progress={saveProgress}
      />
      {/* Navigation Buttons */}
      <View className="flex-row gap-4">
        {/* Previous Button */}
        {currentStep > 0 ? (
          <>
            <Button
              variant="outline"
              onPress={handlePrevious}
              disabled={currentStep === 1}
              className='max-w-[150px] flex-1'
            >
              <Text>
                Back
              </Text>
            </Button>
            {isLastStep ? (
              <Button
                variant="outline"
                className='flex-1'
                onPress={handleFinish}
                disabled={isSaving}
              >
                <Text>{isSaving ? 'Saving...' : 'Complete Setup'}</Text>
              </Button>
            ) : (
              <Button
                variant="outline"
                className='flex-1'
                onPress={handleNext}
                disabled={!canGoNext}
              >
                <Text>Looks Good — Continue</Text>
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="outline"
            className='flex-1'
            onPress={handleNext}
            disabled={!canGoNext}
          >
            <Text>Let's Start</Text>
          </Button>
        )}
        {/* Next/Finish Button */}
      </View>
    </View>
  );
}
