import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Modal } from '@/components/ui/modal';
// import { getAllAccounts, removeAccount, SavedAccount } from '@/lib/services/multi-account-storage';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { setMode, signinWithAuth, signOut } from '@/lib/redux/slices/auth-slice';
import { useToast } from '@/lib/contexts';
import { router } from 'expo-router';
import { UserCircle, X, Plus, LogOut } from 'lucide-react-native';
import { getAllClients } from '@/lib/services/clients-service';
import { RootState } from '@/lib/redux/store';

interface AccountSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AccountSwitcherModal({ visible, onClose }: AccountSwitcherModalProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { artist, client, isAuthenticated } = useAppSelector((state: RootState) => state.auth);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [switching, setSwitching] = useState(false);

  const currentEmail = artist?.email || client?.email || '';

  // Fetch all clients linked with the current artist when the modal opens
  useEffect(() => {
    const fetchLinkedClients = async () => {
      if (!visible || !artist?.id) return;

      try {
        setLoading(true);
        const linkedClients = await getAllClients(artist.id);
        setAccounts(linkedClients || []);
      } catch (error) {
        console.error('Error fetching linked clients for account switcher:', error);
        toast({
          title: 'Failed to load clients',
          description: 'Something went wrong while loading your clients. Please try again.',
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedClients();
  }, [visible, artist?.id, toast]);

  const handleSwitchAccount = async (email: string) => {
    if (!email) return;

    try {
      setSwitching(true);
      const resultAction = await dispatch(signinWithAuth({
        email: email,
        password: email,
      }));

      if (signinWithAuth.fulfilled.match(resultAction)) {
        const { artist, client, session } = resultAction.payload;

        console.log('artist', artist);

        // Show success message
        toast({
          title: 'Welcome Back!',
          description: 'You have successfully signed in.',
          variant: 'success',
          duration: 3000,
        });

        // Determine app mode based on user type
        let appMode: 'preview' | 'production' | 'client';
        if (client) {
          // User is a client
          appMode = 'client';
        } else if (artist) {
          // User is an artist, determine mode based on subscription status
          appMode = artist.subscription_active ? 'production' : 'preview';
        } else {
          // Fallback to preview
          appMode = 'preview';
        }

        // Set the app mode in Redux state
        dispatch(setMode(appMode));

        // Small delay to ensure Redux state is updated before navigation
        // setTimeout(() => {
        //   // Navigate to appropriate screen based on mode
        //   router.replace('/');
        // }, 100);
      } else if (signinWithAuth.rejected.match(resultAction)) {
        // Handle signin error
        onClose();
        const errorMessage = resultAction.payload as string || 'Failed to sign in';
        toast({
          title: 'Failed to switch account',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error switching account:', error);
      onClose();
      toast({
        title: 'Failed to switch account',
        description: 'Something went wrong while switching your account. Please try again.',
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      {switching && (
        <View className='absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/50 z-10'>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      )}
      <View className="bg-background rounded-2xl p-6 max-w-md w-full">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text variant="h3">Switch Account</Text>
          <Pressable onPress={onClose} className="p-2">
            <X size={24} color="#fff" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Current Account */}
          {isAuthenticated && (
            <View className="mb-4 px-4 py-2 bg-background rounded-xl border" style={{ borderColor: '#10B981', borderWidth: 2 }}>
              <View className="flex-row items-center gap-3">
                {artist?.avatar ? (
                  <Image
                    source={{ uri: artist?.avatar }}
                    className="w-12 h-12 rounded-full"
                  />
                ) : artist?.photo ? (
                  <Image
                    source={{ uri: artist?.photo }}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-border items-center justify-center">
                    <UserCircle size={32} color="#888" />
                  </View>
                )}
                <View className="flex-1">
                  <Text variant="large" className="font-semibold">
                    {artist?.full_name || client?.full_name}
                  </Text>
                  <Text variant="small" className="text-text-secondary">
                    {currentEmail}
                  </Text>
                  <Text variant="small" className="text-primary capitalize">
                    {artist ? 'Artist' : 'Client'} Account
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Saved Accounts List */}
          <View>
            <Text variant="small" className="text-text-secondary mb-3">
              CLIENTS ({accounts.length})
            </Text>
            {accounts.map((account) => (
              <Pressable onPress={() => handleSwitchAccount(account.email)} key={account.id} className="mb-4 px-4 py-2 bg-background rounded-xl border border-border">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-border items-center justify-center">
                    <UserCircle size={32} color="#888" />
                  </View>
                  <View className="flex-1">
                    <Text variant="large" className="font-semibold">
                      {account.full_name}
                    </Text>
                    <Text variant="small" className="text-text-secondary">
                      {account.email}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
