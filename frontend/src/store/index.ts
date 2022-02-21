import { configureStore, createSelector } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import api from './api';
import authenticationReducer, { Scope, setToken } from './authentication';
import displayReducer from './display';
import errorLogger from './errors';
import { login as serverLogin, logout as serverLogout } from './server';
import stripReducer from './strip';
import ws from './ws';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    authentication: authenticationReducer,
    display: displayReducer,
    strip: stripReducer,
    ws: ws.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware).concat(ws.middleware).concat(errorLogger),
});

// Trigger re-fetches upon reconnection and upon regaining focus
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;

// Create selector for checking permissions
type Selector<S> = (state: RootState) => S;
export const hasPermission = (scope: Scope): Selector<boolean> =>
  createSelector(
    [(state: RootState) => state.authentication.permissions],
    (permissions) => permissions.indexOf(scope) !== -1,
  );

// Create composite action for logging in
export const login = (token: string) => (dispatch: Dispatch) => {
  dispatch(setToken(token));
  dispatch(serverLogin(token));
};

// Create composite action for logging out
export const logout = (dispatch: Dispatch) => {
  dispatch(setToken(undefined));
  dispatch(serverLogout());
};

// Re-export stuff
export {
  useListAnimationsQuery,
  useGetAnimationQuery,
  useCreateAnimationMutation,
  useUpdateAnimationMutation,
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
export { Scope, setToken } from './authentication';
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
