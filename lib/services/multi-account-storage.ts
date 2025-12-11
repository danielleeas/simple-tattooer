import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ACCOUNTS_KEY = 'multi_accounts';
const ACCOUNTS_KEY_BACKUP = '@simpletattooer:multi_accounts';
const CURRENT_ACCOUNT_KEY = 'current_account_id';
const MAX_ACCOUNTS = 5; // Maximum number of accounts to store

export interface SavedAccount {
  id: string; // Unique ID (email-based hash or UUID)
  email: string;
  password: string;
  accountType: 'artist' | 'client';
  fullName: string;
  photo?: string; // Profile photo URL
  lastUsed: number; // Timestamp for sorting
}

/**
 * Generate a unique ID for an account based on email
 */
function generateAccountId(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Get all saved accounts
 */
export async function getAllAccounts(): Promise<SavedAccount[]> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : [];
    }

    // Try SecureStore first
    let stored = await SecureStore.getItemAsync(ACCOUNTS_KEY);

    if (stored) {
      return JSON.parse(stored);
    }

    // Fall back to AsyncStorage
    stored = await AsyncStorage.getItem(ACCOUNTS_KEY_BACKUP);

    if (stored) {
      const accounts = JSON.parse(stored);
      // Restore to SecureStore for faster future access
      await SecureStore.setItemAsync(ACCOUNTS_KEY, stored);
      return accounts;
    }

    return [];
  } catch (error) {
    console.error('[MULTI-ACCOUNT] Error retrieving accounts:', error);
    return [];
  }
}

/**
 * Save an account to the multi-account store
 * If account exists, updates it. If new, adds it.
 * Automatically removes oldest account if MAX_ACCOUNTS is exceeded.
 */
export async function saveAccount(
  email: string,
  password: string,
  accountType: 'artist' | 'client',
  fullName: string,
  photo?: string
): Promise<void> {
  try {
    const accountId = generateAccountId(email);
    const accounts = await getAllAccounts();

    // Remove existing account with same email
    const filteredAccounts = accounts.filter(acc => acc.id !== accountId);

    // Create new account object
    const newAccount: SavedAccount = {
      id: accountId,
      email,
      password,
      accountType,
      fullName,
      photo,
      lastUsed: Date.now(),
    };

    // Add new account at the beginning
    filteredAccounts.unshift(newAccount);

    // Keep only MAX_ACCOUNTS most recent accounts
    const limitedAccounts = filteredAccounts.slice(0, MAX_ACCOUNTS);

    // Save to both stores
    const accountsJson = JSON.stringify(limitedAccounts);

    if (Platform.OS === 'web') {
      localStorage.setItem(ACCOUNTS_KEY, accountsJson);
      localStorage.setItem(CURRENT_ACCOUNT_KEY, accountId);
    } else {
      await Promise.all([
        SecureStore.setItemAsync(ACCOUNTS_KEY, accountsJson),
        AsyncStorage.setItem(ACCOUNTS_KEY_BACKUP, accountsJson),
        SecureStore.setItemAsync(CURRENT_ACCOUNT_KEY, accountId),
      ]);
    }

    console.log(`[MULTI-ACCOUNT] Saved account for ${email} (${accountType})`);
  } catch (error) {
    console.error('[MULTI-ACCOUNT] Error saving account:', error);
  }
}

/**
 * Get a specific account by email
 */
export async function getAccount(email: string): Promise<SavedAccount | null> {
  try {
    const accounts = await getAllAccounts();
    const accountId = generateAccountId(email);
    return accounts.find(acc => acc.id === accountId) || null;
  } catch (error) {
    console.error('[MULTI-ACCOUNT] Error getting account:', error);
    return null;
  }
}

/**
 * Update the lastUsed timestamp for an account
 */
export async function updateAccountLastUsed(email: string): Promise<void> {
  try {
    const accounts = await getAllAccounts();
    const accountId = generateAccountId(email);

    const updatedAccounts = accounts.map(acc =>
      acc.id === accountId
        ? { ...acc, lastUsed: Date.now() }
        : acc
    );

    // Sort by lastUsed (most recent first)
    updatedAccounts.sort((a, b) => b.lastUsed - a.lastUsed);

    const accountsJson = JSON.stringify(updatedAccounts);

    if (Platform.OS === 'web') {
      localStorage.setItem(ACCOUNTS_KEY, accountsJson);
      localStorage.setItem(CURRENT_ACCOUNT_KEY, accountId);
    } else {
      await Promise.all([
        SecureStore.setItemAsync(ACCOUNTS_KEY, accountsJson),
        AsyncStorage.setItem(ACCOUNTS_KEY_BACKUP, accountsJson),
        SecureStore.setItemAsync(CURRENT_ACCOUNT_KEY, accountId),
      ]);
    }
  } catch (error) {
    console.error('[MULTI-ACCOUNT] Error updating account lastUsed:', error);
  }
}

/**
 * Remove an account from the store
 */
export async function removeAccount(email: string): Promise<void> {
  try {
    const accounts = await getAllAccounts();
    const accountId = generateAccountId(email);

    const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
    const accountsJson = JSON.stringify(filteredAccounts);

    if (Platform.OS === 'web') {
      localStorage.setItem(ACCOUNTS_KEY, accountsJson);
    } else {
      await Promise.all([
        SecureStore.setItemAsync(ACCOUNTS_KEY, accountsJson),
        AsyncStorage.setItem(ACCOUNTS_KEY_BACKUP, accountsJson),
      ]);
    }

    console.log(`[MULTI-ACCOUNT] Removed account for ${email}`);
  } catch (error) {
    console.error('[MULTI-ACCOUNT] Error removing account:', error);
  }
}

/**
 * Get the currently active account ID
 */
export async function getCurrentAccountId(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(CURRENT_ACCOUNT_KEY);
    }

    return await SecureStore.getItemAsync(CURRENT_ACCOUNT_KEY);
  } catch (error) {
    console.error('[MULTI-ACCOUNT] Error getting current account ID:', error);
    return null;
  }
}

/**
 * Clear all saved accounts
 */
export async function clearAllAccounts(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ACCOUNTS_KEY);
      localStorage.removeItem(CURRENT_ACCOUNT_KEY);
    } else {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCOUNTS_KEY),
        AsyncStorage.removeItem(ACCOUNTS_KEY_BACKUP),
        SecureStore.deleteItemAsync(CURRENT_ACCOUNT_KEY),
      ]);
    }

    console.log('[MULTI-ACCOUNT] Cleared all accounts');
  } catch (error) {
    console.error('[MULTI-ACCOUNT] Error clearing accounts:', error);
  }
}

/**
 * Check if an account exists
 */
export async function hasAccount(email: string): Promise<boolean> {
  try {
    const account = await getAccount(email);
    return account !== null;
  } catch (error) {
    console.error('[MULTI-ACCOUNT] Error checking account:', error);
    return false;
  }
}
