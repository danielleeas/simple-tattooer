import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getArtistProfile } from '@/lib/services/auth-service';
import { Artist } from '@/lib/redux/types';

export interface ArtistState {
  artist: Artist | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ArtistState = {
  artist: null,
  isLoading: false,
  error: null,
};

// Async thunk for fetching artist profile
export const fetchArtistProfile = createAsyncThunk(
  'artist/fetchArtistProfile',
  async (artistId: string, { rejectWithValue }) => {
    try {
      const artistProfile = await getArtistProfile(artistId);
      if (!artistProfile) {
        throw new Error('Artist profile not found');
      }
      return artistProfile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch artist profile');
    }
  }
);

export const artistSlice = createSlice({
  name: 'artist',
  initialState,
  reducers: {
    setArtist: (state, action: PayloadAction<Artist>) => {
      state.artist = action.payload;
      state.error = null;
    },
    clearArtist: (state) => {
      state.artist = null;
      state.error = null;
    },
    setArtistLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setArtistError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearArtistError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArtistProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchArtistProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.artist = action.payload;
        state.error = null;
      })
      .addCase(fetchArtistProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setArtist,
  clearArtist,
  setArtistLoading,
  setArtistError,
  clearArtistError,
} = artistSlice.actions;

export default artistSlice.reducer;
