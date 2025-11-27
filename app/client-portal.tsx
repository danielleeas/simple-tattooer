import { View, Image } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useCallback, useEffect, useRef, useState } from "react";
import { findClientById } from "@/lib/services/clients-service";
import { useAppDispatch } from "@/lib/redux/hooks";
import { signinWithAuth } from "@/lib/redux/slices/auth-slice";
import { useToast } from "@/lib/contexts/toast-context";

import LOGO from '@/assets/images/logo.png';

export default function ClientPortal() {

  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const hasSignedIn = useRef(false);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadClient = useCallback(async () => {
    const client = await findClientById(id);
    setClient(client);
  }, [id]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleSignin = async (client: any) => {
    try {
      setLoading(true);
      console.log("signing in", client);
      const resultAction = await dispatch(signinWithAuth({
        email: client.email,
        password: client.email,
      }));

      if (signinWithAuth.fulfilled.match(resultAction)) {
        const { client, session } = resultAction.payload;

        // Show success message
        toast({
          title: 'Welcome Back!',
          description: 'You have successfully signed in.',
          variant: 'success',
          duration: 3000,
        });
      } else if (signinWithAuth.rejected.match(resultAction)) {
        // Handle signin error
        const errorMessage = resultAction.payload as string || 'Failed to sign in';
        console.log("error", errorMessage);
        toast({
          title: 'Signin Failed',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (client && !hasSignedIn.current) {
      hasSignedIn.current = true;
      handleSignin(client);
    }
  }, [client]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        <SafeAreaView className='flex-1 bg-background'>
          <View className='flex-1 bg-background items-center justify-center'>
            <Image source={LOGO} style={{ width: 140, height: 140 }} resizeMode="contain" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  console.log(client);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-1 bg-background pt-4 pb-2 gap-6'>
          <Text>Client Portal</Text>
        </View>
      </SafeAreaView>
    </>
  );
}