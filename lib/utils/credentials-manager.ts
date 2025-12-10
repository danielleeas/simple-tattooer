import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CREDENTIALS_KEY = 'user_credentials';

export interface SavedCredentials {
  email: string;
  password: string;
}

/**
 * Save user credentials securely
 * This mimics Android's password autofill by storing credentials locally
 */
export async function saveCredentials(email: string, password: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // On web, use localStorage as fallback
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email, password }));
      return;
    }

    const credentials: SavedCredentials = { email, password };
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
    console.log('Credentials saved successfully');
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
}

/**
 * Retrieve saved credentials
 */
export async function getCredentials(): Promise<SavedCredentials | null> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(CREDENTIALS_KEY);
      return stored ? JSON.parse(stored) : null;
    }

    const stored = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    return null;
  }
}

/**
 * Delete saved credentials
 */
export async function deleteCredentials(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(CREDENTIALS_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    console.log('Credentials deleted successfully');
  } catch (error) {
    console.error('Error deleting credentials:', error);
  }
}

/**
 * Check if credentials exist
 */
export async function hasCredentials(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(CREDENTIALS_KEY) !== null;
    }

    const stored = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    return stored !== null;
  } catch (error) {
    console.error('Error checking credentials:', error);
    return false;
  }
}

