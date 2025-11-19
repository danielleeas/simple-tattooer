import React, { useRef, useEffect } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';

import Welcome from './steps/Welcome';
import { DetailsStep } from './steps/DetailsStep';
import { BrandingStep } from './steps/BrandingStep';
import { CalendarStep } from './steps/CalendarStep';
import { DepositStep } from './steps/DepositStep';
import { BookingRulesStep } from './steps/BookingRulesStep';
import { DrawingRulesStep } from './steps/DrawingRulesStep';
import { CancellationListStep } from './steps/CancellationListStep';
import { PaymentMethodStep } from './steps/PaymentMethodStep';
import { WaiverUploadStep } from './steps/WaiverUploadStep';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { WizardProgress } from '@/components/wizard/WizardProgress';

const { width: screenWidth } = Dimensions.get('window');

const STEP_COMPONENTS = [
  Welcome,
  DetailsStep,
  BrandingStep,
  CalendarStep,
  DepositStep,
  BookingRulesStep,
  DrawingRulesStep,
  CancellationListStep,
  PaymentMethodStep,
  WaiverUploadStep,
];

export function AnimatedWizard() {
  const { stepNumber, isSaving } = useSetupWizard();
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: -stepNumber * screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [stepNumber, translateX]);

  return (
    <View className="flex-1 bg-background gap-4 relative">
      {/* Progress Indicator */}
      <WizardProgress 
        currentStep={stepNumber} 
        totalSteps={STEP_COMPONENTS.length-1}
      />

      {/* Animated Step Container */}
      <View className="flex-1 overflow-hidden">
        <Animated.View
          className='flex-1 flex-row'
          style={{ width: screenWidth * STEP_COMPONENTS.length, transform: [{ translateX }] }}
        >
          {STEP_COMPONENTS.map((StepComponent, index) => (
            <View
              key={index}
              className='flex-1 px-4'
              style={{
                width: screenWidth,
              }}
            >
              <StepComponent />
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Navigation Controls */}
      <WizardNavigation 
        currentStep={stepNumber}
        totalSteps={STEP_COMPONENTS.length-1}
      />
    </View>
  );
}
