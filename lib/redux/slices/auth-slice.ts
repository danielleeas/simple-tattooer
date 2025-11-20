import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { signUpUser, createArtistProfile, signOutArtist, getCurrentArtist, signInUser, getArtistProfile } from '@/lib/services/auth-service';
import { saveSubscriptionToSupabase } from '@/lib/services/subscribe-service';
import { saveSessionToStorage, saveArtistToStorage, clearStoredAuthData } from '@/lib/services/session-service';
import { Artist } from '@/lib/redux/types';

export interface AuthState {
  artist: Artist | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signupLoading: boolean;
  signinLoading: boolean;
  mode: 'preview' | 'production';
}

const initialState: AuthState = {
  artist: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  signupLoading: false,
  signinLoading: false,
  mode: 'preview',
};

// Async thunk for signup with subscription
export const signupWithSubscription = createAsyncThunk(
  'auth/signupWithSubscription',
  async (params: {
    signupData: { email: string; password: string; name: string };
    subscribeData: any;
  }, { rejectWithValue }) => {
    try {
      // Step 1: Sign up user with Supabase Auth
      const { user, session, error: authError } = await signUpUser(params.signupData);
      if (authError) {
        throw new Error(authError.message || 'Failed to create account');
      }
      if (!user) {
        throw new Error('No user returned from signup');
      }

      // Step 2: Create artist profile in our custom artists table
      let artistProfile = await createArtistProfile(user.id, {
        full_name: params.signupData.name,
        email: params.signupData.email,
      });

      // Step 3: Save subscription data to Supabase if subscribe data exists
      if (params.subscribeData) {
        await saveSubscriptionToSupabase(user.id, params.subscribeData);
        
        // Step 3.5: Fetch updated artist profile to get latest subscription status
        const updatedArtistProfile = await getArtistProfile(user.id);
        if (updatedArtistProfile) {
          artistProfile = updatedArtistProfile;
        }
      }

      // Step 4: Save session and artist data to storage for persistence
      await saveSessionToStorage(session);
      if (artistProfile) {
        await saveArtistToStorage(artistProfile as any);
      }

      return { artist: artistProfile, session };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create account');
    }
  }
);

// Async thunk for checking current artist
export const checkCurrentArtist = createAsyncThunk(
  'auth/checkCurrentArtist',
  async (_, { rejectWithValue }) => {
    try {
      const { user, session, error } = await getCurrentArtist();
      if (error || !user) {
        throw new Error('No authenticated artist');
      }
      // Get artist profile from our custom artists table
      const artistProfile = await getArtistProfile(user.id);
      if (!artistProfile) {
        throw new Error('Artist profile not found');
      }
      return { artist: artistProfile, session };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get current artist');
    }
  }
);

// Async thunk for fetching updated artist profile
export const fetchUpdatedArtistProfile = createAsyncThunk(
  'auth/fetchUpdatedArtistProfile',
  async (artistId: string, { rejectWithValue }) => {
    try {
      const artistProfile = await getArtistProfile(artistId);
      if (!artistProfile) {
        throw new Error('Artist profile not found');
      }
      return artistProfile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch updated artist profile');
    }
  }
);

// Async thunk for signin
export const signinWithAuth = createAsyncThunk(
  'auth/signinWithAuth',
  async (signinData: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Step 1: Sign in user with Supabase Auth
      const { user, session, error: authError } = await signInUser(signinData.email, signinData.password);
      if (authError) {
        throw new Error(authError.message || 'Failed to sign in');
      }
      if (!user) {
        throw new Error('No user returned from signin');
      }

      // Step 2: Get artist profile from our custom artists table
      const artistProfile = await getArtistProfile(user.id);
      if (!artistProfile) {
        throw new Error('Artist profile not found');
      }

      // Step 3: Save session and artist data to storage for persistence
      await saveSessionToStorage(session);
      await saveArtistToStorage(artistProfile as any);

      return { artist: artistProfile, session };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sign in');
    }
  }
);

// Async thunk for sign out
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await signOutArtist();
      if (error) {
        throw new Error(error.message || 'Failed to sign out');
      }
      // Clear stored auth data
      await clearStoredAuthData();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sign out');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setArtist: (state, action: PayloadAction<Artist>) => {
      state.artist = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    setSession: (state, action: PayloadAction<any>) => {
      state.session = action.payload;
    },
    updateArtistRules: (state, action: PayloadAction<any>) => {
      if (state.artist) {
        state.artist = {
          ...state.artist,
          rule: {
            ...state.artist.rule,
            ...action.payload
          }
        };
      }
    },
    updateArtistTemplates: (state, action: PayloadAction<any>) => {
      if (state.artist) {
        state.artist = {
          ...state.artist,
          template: {
            ...state.artist.template,
            ...action.payload
          }
        };
      }
    },
    updateArtistFlows: (state, action: PayloadAction<any>) => {
      if (state.artist) {
        state.artist = {
          ...state.artist,
          flow: {
            ...state.artist.flow,
            ...action.payload
          }
        };
      }
    },
    clearArtist: (state) => {
      state.artist = null;
      state.session = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.signupLoading = false;
      state.signinLoading = false;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    updateArtistSubscription: (state, action: PayloadAction<{ subscription_active: boolean; subscription_type?: string }>) => {
      if (state.artist) {
        state.artist.subscription_active = action.payload.subscription_active;
        state.artist.subscription_type = action.payload.subscription_type;
      }
    },
    setMode: (state, action: PayloadAction<'preview' | 'production'>) => {
      state.mode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Signup with subscription
      .addCase(signupWithSubscription.pending, (state) => {
        state.signupLoading = true;
        state.error = null;
      })
      .addCase(signupWithSubscription.fulfilled, (state, action) => {
        state.signupLoading = false;
        state.artist = action.payload.artist;
        state.session = action.payload.session;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupWithSubscription.rejected, (state, action) => {
        state.signupLoading = false;
        state.error = action.payload as string;
      })
      // Signin with auth
      .addCase(signinWithAuth.pending, (state) => {
        state.signinLoading = true;
        state.error = null;
      })
      .addCase(signinWithAuth.fulfilled, (state, action) => {
        state.signinLoading = false;
        state.artist = action.payload.artist;
        state.session = action.payload.session;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signinWithAuth.rejected, (state, action) => {
        state.signinLoading = false;
        state.error = action.payload as string;
      })
      // Check current artist
      .addCase(checkCurrentArtist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkCurrentArtist.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.artist = action.payload.artist;
          state.session = action.payload.session;
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(checkCurrentArtist.rejected, (state, action) => {
        state.isLoading = false;
        state.artist = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // Sign out
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.artist = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch updated artist profile
      .addCase(fetchUpdatedArtistProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUpdatedArtistProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.artist = action.payload;
        state.error = null;
      })
      .addCase(fetchUpdatedArtistProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setArtist,
  setSession,
  updateArtistRules,
  updateArtistTemplates,
  updateArtistFlows,
  clearArtist,
  setAuthLoading,
  setAuthError,
  clearAuthError,
  updateArtistSubscription,
  setMode,
} = authSlice.actions;

export default authSlice.reducer;
