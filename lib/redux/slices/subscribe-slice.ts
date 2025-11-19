import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface SubscribeData {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  subscribeToken?: string;
  dataAndroid?: string;
  signatureAndroid?: string;
  subscriptionType: 'monthly' | 'yearly';
}

interface SubscribeState {
  subscribeData: SubscribeData | null;
  isSubscribeCompleted: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscribeState = {
  subscribeData: null,
  isSubscribeCompleted: false,
  isLoading: false,
  error: null,
};

export const subscribeSlice = createSlice({
  name: 'subscribe',
  initialState,
  reducers: {
    setSubscribeLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      state.error = null;
    },
    setSubscribeCompleted: (state, action: PayloadAction<SubscribeData>) => {
      state.subscribeData = action.payload;
      state.isSubscribeCompleted = true;
      state.isLoading = false;
      state.error = null;
    },
    setSubscribeError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isSubscribeCompleted = false;
    },
    clearSubscribeData: (state) => {
      state.subscribeData = null;
      state.isSubscribeCompleted = false;
      state.isLoading = false;
      state.error = null;
    },
    resetSubscribe: (state) => {
      state.subscribeData = null;
      state.isSubscribeCompleted = false;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setSubscribeLoading,
  setSubscribeCompleted,
  clearSubscribeData,
  setSubscribeError,
  resetSubscribe,
} = subscribeSlice.actions;

export default subscribeSlice.reducer;
