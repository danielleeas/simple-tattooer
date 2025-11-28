import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/ui-slice';
import authReducer from './slices/auth-slice';
import subscribeReducer from './slices/subscribe-slice';
import artistReducer from './slices/artist-slice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    subscribe: subscribeReducer,
    artist: artistReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

