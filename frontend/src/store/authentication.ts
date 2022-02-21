import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export enum Scope {
  CONTROL_LIGHTS = 'control:lights',
  EDIT_ANIMATIONS = 'edit:animations',
  EDIT_PRESETS = 'edit:presets',
  EDIT_SCHEDULES = 'edit:schedules',
}

interface AuthenticationState {
  permissions: Scope[];
  token?: string;
}

const initialState: AuthenticationState = {
  permissions: [],
};

export const authenticationSlice = createSlice({
  name: 'authentication',
  initialState,
  reducers: {
    setPermissions: (state, action: PayloadAction<Scope[]>) => {
      state.permissions = action.payload;
    },
    setToken: (state, action: PayloadAction<string | undefined>) => {
      state.token = action.payload;
    },
  },
});

export default authenticationSlice.reducer;
export const { setToken } = authenticationSlice.actions;
