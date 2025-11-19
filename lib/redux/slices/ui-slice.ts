import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  showSplash: boolean;
  showWelcome: boolean;
  showPurchase: boolean;
  showExtendSubscription: boolean;
}

const initialState: UIState = {
  showSplash: true,
  showWelcome: false,
  showPurchase: false,
  showExtendSubscription: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setShowSplash: (state, action: PayloadAction<boolean>) => {
      state.showSplash = action.payload;
    },
    setShowWelcome: (state, action: PayloadAction<boolean>) => {
      state.showWelcome = action.payload;
    },
    setShowPurchase: (state, action: PayloadAction<boolean>) => {
      state.showPurchase = action.payload;
    },
    setShowExtendSubscription: (state, action: PayloadAction<boolean>) => {
      state.showExtendSubscription = action.payload;
    },
    hideSplash: (state) => {
      state.showSplash = false;
    },
    resetUI: (state) => {
      state.showSplash = true;
      state.showWelcome = false;
      state.showPurchase = false;
      state.showExtendSubscription = false;
    },
  },
});

export const { setShowSplash, setShowWelcome, setShowPurchase, setShowExtendSubscription, hideSplash, resetUI } = uiSlice.actions;

export default uiSlice.reducer;

