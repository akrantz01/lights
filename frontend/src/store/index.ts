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

// Re-export stuff
export {
  useListAnimationsQuery,
  useUpsertAnimationMutation,
  useRemoveAnimationMutation,
  useListPresetsQuery,
  useGetPresetQuery,
  useCreatePresetMutation,
  useUpdatePresetMutation,
  useRemovePresetMutation,
  useListSchedulesQuery,
  useGetScheduleQuery,
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
  useToggleScheduleMutation,
  useRemoveScheduleMutation,
} from './api';
export { useDispatch, useSelector } from './hooks';
export {
  applyPreset,
  setArbitraryPixels,
  setBrightness,
  setColor,
  setPixel,
  setPixelRange,
  startAnimation,
  stopAnimation,
  turnOff,
  turnOn,
} from './server';
export { connect } from './ws';
