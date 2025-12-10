import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CREDENTIALS_KEY = 'user_credentials';
const CREDENTIALS_KEY_BACKUP = '@simpletattooer:credentials'; // For AsyncStorage backup

export interface SavedCredentials {
  email: string;
  password: string;
}

/**
 * Save user credentials securely
 * Stores in BOTH SecureStore (immediate access) and AsyncStorage (survives reinstall via cloud backup)
 * - iOS: AsyncStorage backed up to iCloud
 * - Android: AsyncStorage backed up to Google Drive
 */
export async function saveCredentials(email: string, password: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // On web, use localStorage as fallback
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email, password }));
      console.log('[CREDENTIALS] Saved to localStorage (web)');
      return;
    }

    const credentials: SavedCredentials = { email, password };
    
    // Save to BOTH locations:
    // 1. SecureStore - for immediate access (but clears on uninstall)
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
    
    // 2. AsyncStorage - for cloud backup (survives reinstall on iOS/Android)
    await AsyncStorage.setItem(CREDENTIALS_KEY_BACKUP, JSON.stringify(credentials));
    
    console.log('[CREDENTIALS] Saved successfully to both SecureStore and AsyncStorage');
  } catch (error) {
    console.error('[CREDENTIALS] Error saving credentials:', error);
  }
}

/**
 * Retrieve saved credentials
 * Tries SecureStore first (faster), falls back to AsyncStorage (survives reinstall)
 */
export async function getCredentials(): Promise<SavedCredentials | null> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(CREDENTIALS_KEY);
      return stored ? JSON.parse(stored) : null;
    }

    // Try SecureStore first (faster access)
    let stored = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    
    if (stored) {
      console.log('[CREDENTIALS] Found in SecureStore');
      return JSON.parse(stored);
    }
    
    // Fall back to AsyncStorage (for reinstall scenarios)
    stored = await AsyncStorage.getItem(CREDENTIALS_KEY_BACKUP);
    
    if (stored) {
      console.log('[CREDENTIALS] Found in AsyncStorage (restored from backup)');
      const credentials = JSON.parse(stored);
      
      // Restore to SecureStore for faster future access
      await SecureStore.setItemAsync(CREDENTIALS_KEY, stored);
      
      return credentials;
    }
    
    console.log('[CREDENTIALS] No credentials found');
    return null;
  } catch (error) {
    console.error('[CREDENTIALS] Error retrieving credentials:', error);
    return null;
  }
}

/**
 * Delete saved credentials from both stores
 */
export async function deleteCredentials(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(CREDENTIALS_KEY);
      return;
    }

    // Delete from both locations
    await Promise.all([
      SecureStore.deleteItemAsync(CREDENTIALS_KEY),
      AsyncStorage.removeItem(CREDENTIALS_KEY_BACKUP)
    ]);
    
    console.log('[CREDENTIALS] Deleted from both stores');
  } catch (error) {
    console.error('[CREDENTIALS] Error deleting credentials:', error);
  }
}

/**
 * Check if credentials exist in either store
 */
export async function hasCredentials(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(CREDENTIALS_KEY) !== null;
    }

    // Check both stores
    const [secureStored, asyncStored] = await Promise.all([
      SecureStore.getItemAsync(CREDENTIALS_KEY),
      AsyncStorage.getItem(CREDENTIALS_KEY_BACKUP)
    ]);
    
    return secureStored !== null || asyncStored !== null;
  } catch (error) {
    console.error('[CREDENTIALS] Error checking credentials:', error);
    return false;
  }
}

