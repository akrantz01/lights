import { createReducer } from '@reduxjs/toolkit';

import { beginReconnect, broken, closed, opened, reconnected } from './actions';

interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
}

const initialState: WebSocketState = {
  connected: false,
  reconnecting: false,
};

const reducer = createReducer(initialState, (builder) =>
  builder
    .addCase(beginReconnect, (state) => {
      state.reconnecting = true;
    })
    .addCase(broken, (state) => {
      state.connected = false;
    })
    .addCase(closed, (state) => {
      state.connected = false;
    })
    .addCase(opened, (state) => {
      state.connected = true;
    })
    .addCase(reconnected, (state) => {
      state.reconnecting = false;
    }),
);

export default reducer;
