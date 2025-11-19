import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const SESSION_KEY = 'supabase_session';
const ARTIST_KEY = 'artist_profile';

export interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: any;
}

export interface StoredArtist {
  id: string;
  email: string;
  full_name: string;
  subscription_active: boolean;
  subscription_type?: string;
  created_at: string;
}

// Save session to AsyncStorage
export const saveSessionToStorage = async (session: any): Promise<void> => {
  try {
    if (session) {
      const sessionData: StoredSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    }
  } catch (error) {
    console.error('Error saving session to storage:', error);
  }
};

// Get session from AsyncStorage
export const getSessionFromStorage = async (): Promise<StoredSession | null> => {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    return null;
  } catch (error) {
    console.error('Error getting session from storage:', error);
    return null;
  }
};

// Save artist profile to AsyncStorage
export const saveArtistToStorage = async (artist: StoredArtist): Promise<void> => {
  try {
    await AsyncStorage.setItem(ARTIST_KEY, JSON.stringify(artist));
  } catch (error) {
    console.error('Error saving artist to storage:', error);
  }
};

// Get artist profile from AsyncStorage
export const getArtistFromStorage = async (): Promise<StoredArtist | null> => {
  try {
    const artistData = await AsyncStorage.getItem(ARTIST_KEY);
    if (artistData) {
      return JSON.parse(artistData);
    }
    return null;
  } catch (error) {
    console.error('Error getting artist from storage:', error);
    return null;
  }
};

// Clear all stored auth data
export const clearStoredAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([SESSION_KEY, ARTIST_KEY]);
  } catch (error) {
    console.error('Error clearing stored auth data:', error);
  }
};

// Check if session is valid (not expired)
export const isSessionValid = (session: StoredSession | null): boolean => {
  if (!session) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at > now;
};

// Restore session from storage and set it in Supabase
export const restoreSessionFromStorage = async (): Promise<{ user: any; session: any; error: any }> => {
  try {
    const storedSession = await getSessionFromStorage();
    
    if (!storedSession || !isSessionValid(storedSession)) {
      return { user: null, session: null, error: new Error('No valid session found') };
    }

    // Set the session in Supabase
    const { data, error } = await supabase.auth.setSession({
      access_token: storedSession.access_token,
      refresh_token: storedSession.refresh_token,
    });

    if (error) {
      console.error('Error setting session:', error);
      return { user: null, session: null, error };
    }

    // Verify the session is actually valid by checking if user exists
    if (!data.user || !data.session) {
      console.error('Session restored but no user/session returned');
      return { user: null, session: null, error: new Error('Invalid session data') };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Error restoring session:', error);
    return { user: null, session: null, error };
  }
};

// Initialize auth state on app start
export const initializeAuth = async (): Promise<{ user: any; session: any; error: any }> => {
  try {
    // First try to get current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (session && !sessionError) {
      // Session exists and is valid
      return { user: session.user, session, error: null };
    }

    // If no current session, try to restore from storage
    const restoreResult = await restoreSessionFromStorage();
    
    // If restore failed or returned error, clear stored data
    if (restoreResult.error || !restoreResult.user || !restoreResult.session) {
      await clearStoredAuthData();
      return { user: null, session: null, error: new Error('Invalid session') };
    }

    return restoreResult;
  } catch (error) {
    console.error('Error initializing auth:', error);
    // Clear stored data on any error
    await clearStoredAuthData();
    return { user: null, session: null, error };
  }
};
