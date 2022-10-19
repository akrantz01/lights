import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export enum Scope {
  CONTROL_LIGHTS = 'control:lights',
  EDIT_ANIMATIONS = 'edit:animations',
  EDIT_PRESETS = 'edit:presets',
  EDIT_SCHEDULES = 'edit:schedules',
}

export interface ProfileState {
  avatar?: string;
  email: string;
  name: string;
}

interface AuthenticationState {
  permissions: Scope[];
  profile?: ProfileState;
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
    setProfile: (state, action: PayloadAction<ProfileState | undefined>) => {
      state.profile = action.payload;
    },
    setToken: (state, action: PayloadAction<string | undefined>) => {
      state.token = action.payload;
    },
  },
});

export default authenticationSlice.reducer;
export const { setProfile, setToken } = authenticationSlice.actions;
