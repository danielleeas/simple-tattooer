import React, { createContext, useContext, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { setArtist, setSession, clearArtist, setMode, setAuthLoading, setClient } from '@/lib/redux/slices/auth-slice';
import { onAuthStateChange, getArtistProfile, getArtistAppMode, getClientProfile } from '@/lib/services/auth-service';
import { saveSessionToStorage, clearStoredAuthData, initializeAuth } from '@/lib/services/session-service';
import { Artist, Client } from '@/lib/redux/types';
import { getCredentials } from '@/lib/utils/credentials-manager';
import { saveAccount, updateAccountLastUsed } from '@/lib/services/multi-account-storage';

interface AuthContextType {
  artist: Artist | null;
  client: Client | null;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: 'preview' | 'production' | 'client';
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const { artist, client, session, isAuthenticated, isLoading, error, mode } = useAppSelector((state: any) => state.auth);

  // Refs to track ongoing operations and prevent race conditions
  const initializationRef = useRef<boolean>(false);
  const authStateChangeRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to determine app mode based on artist and subscription status
  const determineAppMode = useCallback(async (artist: Artist): Promise<'preview' | 'production'> => {
    if (!artist) {
      return 'preview';
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<'preview'>((_, reject) => {
        timeoutRef.current = setTimeout(() => reject(new Error('Timeout')), 10000) as any;
      });

      const modePromise = getArtistAppMode(artist.id);

      const result = await Promise.race([modePromise, timeoutPromise]);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      return result;
    } catch (error) {
      console.warn('Error determining app mode, defaulting to preview:', error);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return 'preview';
    }
  }, []);

  // Check for existing authentication on app start
  useEffect(() => {
    const initializeAuthentication = async () => {
      // Prevent multiple initializations
      if (initializationRef.current) {
        return;
      }

      initializationRef.current = true;

      try {
        // Set loading to true at the start of authentication check
        dispatch(setAuthLoading(true));

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Authentication timeout')), 60000);
        });

        const authPromise = (async () => {
          // First try to initialize auth from stored session
          const { user, session, error } = await initializeAuth();

          console.log("user", user);

          if (user && session && !error) {
            // Artist has valid session, get profile and set state
            const artistProfile: Artist | null = await getArtistProfile(user.id);

            if (artistProfile) {
              // Profile exists, set artist and session
              dispatch(setArtist(artistProfile));
              dispatch(setSession(session));

              // Set mode based on subscription status
              const appMode = artistProfile.subscription_active ? 'production' : 'preview';
              dispatch(setMode(appMode));

              // Save to multi-account store if credentials exist (for both preview and production)
              try {
                const credentials = await getCredentials();
                if (credentials && credentials.email === artistProfile.email) {
                  await saveAccount(
                    credentials.email,
                    credentials.password,
                    'artist',
                    artistProfile.full_name,
                    artistProfile.photo
                  );
                  await updateAccountLastUsed(credentials.email);
                }
              } catch (error) {
                console.warn('Failed to save account on auto-login:', error);
              }
            } else {

              const clientProfile: Client | null = await getClientProfile(user.id);

              if (clientProfile) {
                dispatch(setClient(clientProfile));
                dispatch(setSession(session));
                dispatch(setMode('client'));

                // Save to multi-account store if credentials exist
                try {
                  const credentials = await getCredentials();
                  if (credentials && credentials.email === clientProfile.email) {
                    await saveAccount(
                      credentials.email,
                      credentials.password,
                      'client',
                      clientProfile.full_name,
                      clientProfile.links?.[0]?.artist?.photo
                    );
                    await updateAccountLastUsed(credentials.email);
                  }
                } catch (error) {
                  console.warn('Failed to save account on auto-login:', error);
                }
              } else {
                // Profile not found, clear auth state
                dispatch(clearArtist());
                await clearStoredAuthData();
                dispatch(setMode('preview'));
              }
            }
          } else {
            // No valid session found, clear any stored data and set as not authenticated
            dispatch(clearArtist());
            await clearStoredAuthData();
            dispatch(setMode('preview'));
          }
        })();

        await Promise.race([authPromise, timeoutPromise]);

      } catch (error) {
        console.error('Error initializing authentication:', error);
        // Clear auth state on any error
        dispatch(clearArtist());
        await clearStoredAuthData();
        dispatch(setMode('preview'));
      } finally {
        // Set loading to false when authentication check is complete
        dispatch(setAuthLoading(false));
        initializationRef.current = false;
      }
    };

    initializeAuthentication();
  }, [dispatch, determineAppMode]);

  // Listen to auth state changes for automatic login/logout
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      // Skip processing during initialization to avoid race conditions
      if (initializationRef.current) {
        return;
      }

      try {
        if (event === 'SIGNED_OUT') {
          // Artist signed out - clear state and storage
          dispatch(clearArtist());
          await clearStoredAuthData();
          dispatch(setMode('preview'));
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Token refreshed - update session and storage
          dispatch(setSession(session));
          await saveSessionToStorage(session);

          // Re-check subscription status on token refresh (non-blocking)
          const user = session.user;
          if (user) {
            determineAppMode(user).then(appMode => {
              dispatch(setMode(appMode));
            }).catch(error => {
              console.warn('Failed to determine app mode on token refresh:', error);
              dispatch(setMode('preview'));
            });
          }
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
      }
    });

    // Store subscription reference for cleanup
    authStateChangeRef.current = subscription;

    return () => {
      if (authStateChangeRef.current) {
        authStateChangeRef.current.unsubscribe();
        authStateChangeRef.current = null;
      }
    };
  }, [dispatch, determineAppMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (authStateChangeRef.current) {
        authStateChangeRef.current.unsubscribe();
      }
    };
  }, []);

  const value = {
    artist,
    client,
    session,
    isAuthenticated,
    isLoading,
    error,
    mode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
