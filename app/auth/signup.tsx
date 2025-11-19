import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingOverlay } from '@/components/lib/loading-overlay';
import { router, Stack } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { clearSubscribeData } from '@/lib/redux/slices/subscribe-slice';
import { signupWithSubscription, setMode } from '@/lib/redux/slices/auth-slice';
import { useToast } from '@/lib/contexts';

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { subscribeData, isSubscribeCompleted } = useAppSelector((state) => state.subscribe);
  const { signupLoading } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'name':
        if (!value.trim()) {
          error = 'Name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  // Check if artist came from purchase flow
  useEffect(() => {
    if (!isSubscribeCompleted && !subscribeData) {
      // Artist didn't come from purchase flow, redirect back
      toast({
        title: 'Access Denied',
        description: 'Please complete your subscription purchase first.',
        variant: 'error',
        duration: 5000,
      });
    }
  }, [isSubscribeCompleted, subscribeData, toast]);

  const handleSignup = async () => {
    const isNameValid = validateField('name', formData.name);
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);

    if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      try {

        // Use Redux async thunk for signup
        const resultAction = await dispatch(signupWithSubscription({
          signupData: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
          },
          subscribeData,
        }));


        // Check if signup was successful
        if (signupWithSubscription.fulfilled.match(resultAction)) {
          const { artist, session } = resultAction.payload;

          // Show success message
          toast({
            title: 'Account Created!',
            description: 'Welcome to Simple Tattooer! Your account has been created successfully.',
            variant: 'success',
            duration: 3000,
          });

          // Determine app mode based on subscription status
          const appMode = artist?.subscription_active ? 'production' : 'preview';

          // Set the app mode in Redux state
          dispatch(setMode(appMode));

          // Small delay to ensure Redux state is updated before navigation
          setTimeout(() => {
            router.replace('/artist/wizard');

            // Clear subscribe data after navigation to avoid race conditions
            setTimeout(() => {
              dispatch(clearSubscribeData());
            }, 500);
          }, 100);
        } else if (signupWithSubscription.rejected.match(resultAction)) {
          // Handle signup error
          const errorMessage = resultAction.payload as string || 'Failed to create account';
          toast({
            title: 'Signup Failed',
            description: errorMessage,
            variant: 'error',
            duration: 5000,
          });
        }

      } catch (error: any) {
        console.error('Unexpected error during signup:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'error',
          duration: 5000
        });
      }
    }
  };

  const handleSignin = () => {
    // router.dismissAll();
    router.replace('/auth/signin');
  };


  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <SafeAreaView className='flex-1 bg-background'>
        <KeyboardAwareScrollView
          bottomOffset={50}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-8 gap-6">
            <View>
              <Text variant="h2">
                Create Account
              </Text>
              <Text className="mt-2 text-text-secondary">
                Do this once and you don’t need to login again
              </Text>
            </View>

            <View className="gap-5">
              <View>
                <Text variant="large" className="mb-2">
                  Name
                </Text>
                <Input
                  placeholder="Enter your name"
                  value={formData.name}
                  onChangeText={(text: string) => {
                    setFormData({ ...formData, name: text });
                    if (errors.name) validateField('name', text);
                  }}
                  onBlur={() => validateField('name', formData.name)}
                  autoCapitalize="words"
                  error={!!errors.name}
                  errorText={errors.name}
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  textContentType="none"
                />
              </View>

              <View>
                <Text variant="large" className="mb-2">
                  Email
                </Text>
                <Input
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text: string) => {
                    setFormData({ ...formData, email: text });
                    if (errors.email) validateField('email', text);
                  }}
                  onBlur={() => validateField('email', formData.email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!errors.email}
                  errorText={errors.email}
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  textContentType="none"
                />
              </View>

              <View>
                <Text variant="large" className="mb-2">
                  Password
                </Text>
                <Input
                  placeholder="Create a password"
                  value={formData.password}
                  onChangeText={(text: string) => {
                    setFormData({ ...formData, password: text });
                    if (errors.password) validateField('password', text);
                    // Also validate confirm password if it has a value
                    if (formData.confirmPassword) validateField('confirmPassword', formData.confirmPassword);
                  }}
                  onBlur={() => validateField('password', formData.password)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  rightIcon={showPassword ? EyeOff : Eye}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  rightIconLabel="Toggle password visibility"
                  error={!!errors.password}
                  errorText={errors.password}
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  textContentType="none"
                />
              </View>

              <View>
                <Text variant="large" className="mb-2">
                  Confirm Password
                </Text>
                <Input
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChangeText={(text: string) => {
                    setFormData({ ...formData, confirmPassword: text });
                    if (errors.confirmPassword) validateField('confirmPassword', text);
                  }}
                  onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  rightIcon={showConfirmPassword ? EyeOff : Eye}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  rightIconLabel="Toggle password visibility"
                  error={!!errors.confirmPassword}
                  errorText={errors.confirmPassword}
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  textContentType="none"
                />
              </View>
            </View>

            <View className="mt-4 gap-4">
              <Button
                onPress={handleSignup}
                size="lg"
                className="w-full"
                disabled={signupLoading}
              >
                <Text>{signupLoading ? 'Creating Account...' : 'Submit'}</Text>
              </Button>
              <View className="flex-row items-center justify-center">
                <Text>Already have an account? </Text>
                <Pressable onPress={handleSignin}>
                  <Text className="text-primary underline">Sign in</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>

        {/* Loading Overlay */}
        <LoadingOverlay
          visible={signupLoading}
          title="Creating Account"
          subtitle="Please wait while we set up your account..."
        />
      </SafeAreaView>
    </>
  );
}