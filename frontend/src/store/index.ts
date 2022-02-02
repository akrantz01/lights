import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import api from './api';
import displayReducer from './display';
import stripReducer from './strip';
import ws from './ws';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    display: displayReducer,
    strip: stripReducer,
    ws: ws.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware).concat(ws.middleware),
});

// Trigger re-fetches upon reconnection and upon regaining focus
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;
