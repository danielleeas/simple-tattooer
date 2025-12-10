import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingOverlay } from '@/components/lib/loading-overlay';
import { router, Stack } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { signinWithAuth, setMode } from '@/lib/redux/slices/auth-slice';
import { useToast } from '@/lib/contexts';
import Header from '@/components/lib/Header';
import X_IMAGE from "@/assets/images/icons/x.png";

export default function SigninPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { signinLoading } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
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
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleSignin = async () => {
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('password', formData.password);

    if (isEmailValid && isPasswordValid) {
      try {
        // Use Redux async thunk for signin
        const resultAction = await dispatch(signinWithAuth({
          email: formData.email,
          password: formData.password,
        }));

        // Check if signin was successful
        if (signinWithAuth.fulfilled.match(resultAction)) {
          const { artist, session } = resultAction.payload;

          // Show success message
          toast({
            title: 'Welcome Back!',
            description: 'You have successfully signed in.',
            variant: 'success',
            duration: 3000,
          });

          // Determine app mode based on subscription status
          const appMode = artist?.subscription_active ? 'production' : 'preview';

          console.log("appMode", appMode);

          // Set the app mode in Redux state
          dispatch(setMode(appMode));

          // Small delay to ensure Redux state is updated before navigation
          setTimeout(() => {
            if (appMode === 'production') {
              router.push('/');
            } else {
              router.push('/auth/subscribe');
            }
          }, 100);
        } else if (signinWithAuth.rejected.match(resultAction)) {
          // Handle signin error
          const errorMessage = resultAction.payload as string || 'Failed to sign in';
          toast({
            title: 'Signin Failed',
            description: errorMessage,
            variant: 'error',
            duration: 5000,
          });
        }

      } catch (error: any) {
        console.error('Unexpected error during signin:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'error',
          duration: 5000
        });
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <SafeAreaView className='flex-1 bg-background'>
        <Header
          leftButtonImage={X_IMAGE}
          onLeftButtonPress={handleBack}
        />
        <KeyboardAwareScrollView
          bottomOffset={50}
          
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 gap-6">
            <View>
              <Text variant="h2">
                Sign In
              </Text>
              <Text className="mt-2 text-text-secondary">
                Sign Into your account to continue
              </Text>
            </View>

            <View className="gap-5">

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
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={!!errors.email}
                  errorText={errors.email}
                />
              </View>

              <View>
                <Text variant="large" className="mb-2">
                  Password
                </Text>
                <Input
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={(text: string) => {
                    setFormData({ ...formData, password: text });
                    if (errors.password) validateField('password', text);
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
                  autoComplete="password"
                  textContentType="password"
                />
              </View>

            </View>

            <View className="mt-4 gap-4">
              <Button
                variant="outline"
                onPress={handleSignin}
                size="lg"
                className="w-full"
                disabled={signinLoading}
              >
                <Text>{signinLoading ? 'Signing in...' : 'Sign In'}</Text>
              </Button>
            </View>
          </View>
        </KeyboardAwareScrollView>

        {/* Loading Overlay */}
        <LoadingOverlay
          visible={signinLoading}
          className='bg-transparent'
        />
      </SafeAreaView>
    </>
  );
}