import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Modal } from '@/components/ui/modal';
import { getAllAccounts, removeAccount, SavedAccount } from '@/lib/services/multi-account-storage';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { switchAccount, signOut } from '@/lib/redux/slices/auth-slice';
import { useToast } from '@/lib/contexts';
import { router } from 'expo-router';
import { UserCircle, X, Plus, LogOut } from 'lucide-react-native';

interface AccountSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AccountSwitcherModal({ visible, onClose }: AccountSwitcherModalProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { artist, client, isAuthenticated } = useAppSelector((state) => state.auth);

  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);

  const currentEmail = artist?.email || client?.email || '';

  // Load accounts when modal opens
  useEffect(() => {
    if (visible) {
      loadAccounts();
    }
  }, [visible]);

  const loadAccounts = async () => {
    try {
      const savedAccounts = await getAllAccounts();
      setAccounts(savedAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleSwitchAccount = async (account: SavedAccount) => {
    if (account.email === currentEmail) {
      // Already on this account
      toast({
        title: 'Already Active',
        description: 'You are already signed in to this account.',
        variant: 'default',
        duration: 2000,
      });
      onClose();
      return;
    }

    setSwitchingAccountId(account.id);
    setLoading(true);

    try {
      // Use Redux thunk to switch account
      const resultAction = await dispatch(switchAccount({
        email: account.email,
        password: account.password,
      }));

      if (switchAccount.fulfilled.match(resultAction)) {
        toast({
          title: 'Switched Account',
          description: `Switched to ${account.fullName}`,
          variant: 'success',
          duration: 2000,
        });

        onClose();

        // Navigate to home after a brief delay
        setTimeout(() => {
          router.dismissAll();
          router.replace('/');
        }, 100);
      } else {
        toast({
          title: 'Switch Failed',
          description: 'Failed to switch account. Please try again.',
          variant: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error switching account:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while switching accounts.',
        variant: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
      setSwitchingAccountId(null);
    }
  };

  const handleRemoveAccount = async (account: SavedAccount, e: any) => {
    e.stopPropagation();

    if (account.email === currentEmail) {
      toast({
        title: 'Cannot Remove',
        description: 'You cannot remove the currently active account. Please switch to another account first.',
        variant: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await removeAccount(account.email);
      await loadAccounts();

      toast({
        title: 'Account Removed',
        description: `Removed ${account.fullName} from saved accounts.`,
        variant: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error removing account:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove account.',
        variant: 'error',
        duration: 3000,
      });
    }
  };

  const handleAddAccount = () => {
    onClose();
    // Navigate to signin after a brief delay
    setTimeout(() => {
      router.push('/auth/signin');
    }, 100);
  };

  const handleSignOut = async () => {
    setLoading(true);

    try {
      await dispatch(signOut());

      toast({
        title: 'Signed Out',
        description: 'You have been signed out successfully.',
        variant: 'success',
        duration: 2000,
      });

      onClose();

      // Navigate to home after a brief delay
      setTimeout(() => {
        router.dismissAll();
        router.replace('/');
      }, 100);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View className="bg-background rounded-2xl p-6 max-w-md w-full" style={{ maxHeight: '80%' }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text variant="h3">Switch Account</Text>
          <Pressable onPress={onClose} className="p-2">
            <X size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Current Account */}
        {isAuthenticated && (
          <View className="mb-4 p-4 bg-muted rounded-xl border border-border">
            <Text variant="small" className="text-text-secondary mb-2">
              CURRENT ACCOUNT
            </Text>
            <View className="flex-row items-center gap-3">
              {(artist?.photo || client?.links?.[0]?.artist?.photo) ? (
                <Image
                  source={{ uri: artist?.photo || client?.links?.[0]?.artist?.photo }}
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
        <View className="mb-4">
          <Text variant="small" className="text-text-secondary mb-3">
            SAVED ACCOUNTS ({accounts.length})
          </Text>

          <ScrollView className="max-h-64" showsVerticalScrollIndicator={false}>
            {accounts.length === 0 ? (
              <View className="py-8 items-center">
                <Text variant="small" className="text-text-secondary text-center">
                  No saved accounts yet.{'\n'}Sign in to save accounts for quick switching.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {accounts.map((account) => {
                  const isCurrentAccount = account.email === currentEmail;
                  const isSwitching = switchingAccountId === account.id;

                  return (
                    <Pressable
                      key={account.id}
                      onPress={() => !isCurrentAccount && !loading && handleSwitchAccount(account)}
                      className={`p-4 rounded-xl border ${
                        isCurrentAccount
                          ? 'bg-muted border-primary'
                          : 'bg-background border-border'
                      }`}
                      disabled={loading || isCurrentAccount}
                    >
                      <View className="flex-row items-center gap-3">
                        {account.photo ? (
                          <Image
                            source={{ uri: account.photo }}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <View className="w-10 h-10 rounded-full bg-border items-center justify-center">
                            <UserCircle size={28} color="#888" />
                          </View>
                        )}
                        <View className="flex-1">
                          <Text variant="large" className="font-medium">
                            {account.fullName}
                          </Text>
                          <Text variant="small" className="text-text-secondary">
                            {account.email}
                          </Text>
                          <Text variant="small" className="text-primary capitalize">
                            {account.accountType} Account
                          </Text>
                        </View>

                        {isSwitching ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : isCurrentAccount ? (
                          <View className="px-3 py-1 rounded-full bg-primary">
                            <Text variant="small" className="text-background font-medium">
                              Active
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            onPress={(e) => handleRemoveAccount(account, e)}
                            className="p-2"
                            disabled={loading}
                          >
                            <X size={20} color="#888" />
                          </Pressable>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Actions */}
        <View className="gap-3">
          <Pressable
            onPress={handleAddAccount}
            className="flex-row items-center justify-center gap-2 p-4 bg-background border border-border rounded-xl"
            disabled={loading}
          >
            <Plus size={20} color="#fff" />
            <Text variant="large" className="font-medium">
              Add Account
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-center gap-2 p-4 bg-background border border-destructive rounded-xl"
            disabled={loading}
          >
            {loading && !switchingAccountId ? (
              <ActivityIndicator size="small" color="#ff4444" />
            ) : (
              <>
                <LogOut size={20} color="#ff4444" />
                <Text variant="large" className="font-medium text-destructive">
                  Sign Out
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
