import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { Color } from '../types';

interface SetPixelsByIndexPayload {
  indexes: number[];
  color: Color;
}

interface AnimationState {
  id?: string;
  running: boolean;
}

interface SetPresetPayload {
  id: string;
  brightness: number;
  pixels: Color[];
}

interface SetAllPixels {
  fill: boolean;
  pixels: Color[];
}

export enum Type {
  Fill,
  Pixels,
  Animation,
}

interface DisplayState {
  animation: AnimationState;
  fill: boolean;
  pixels: Color[];
  preset?: string;
  type: Type;
}

const initialState: DisplayState = {
  type: Type.Fill,
  animation: {
    running: false,
  },
  fill: true,
  pixels: [
    {
      r: 0,
      g: 0,
      b: 0,
    },
  ],
};

export const displaySlice = createSlice({
  name: 'display',
  initialState,
  reducers: {
    setAllPixels: (state, action: PayloadAction<SetAllPixels>) => {
      state.preset = undefined;

      state.type = action.payload.fill ? Type.Fill : Type.Pixels;
      state.fill = action.payload.fill;
      state.pixels = action.payload.pixels;
    },
    setPixelsByIndex: (state, action: PayloadAction<SetPixelsByIndexPayload>) => {
      state.preset = undefined;
      state.fill = false;

      state.type = Type.Pixels;
      if (state.pixels) {
        for (const index of action.payload.indexes) state.pixels[index] = action.payload.color;
      }
    },
    setPreset: (state, action: PayloadAction<SetPresetPayload>) => {
      state.type = Type.Pixels;
      state.preset = action.payload.id;
      state.pixels = action.payload.pixels;
    },
    startAnimation: (state, action: PayloadAction<string>) => {
      state.preset = undefined;

      state.type = Type.Animation;
      state.animation = {
        running: true,
        id: action.payload,
      };
    },
    stopAnimation: (state) => {
      state.preset = undefined;

      state.type = Type.Animation;
      state.animation = {
        running: false,
      };
    },
  },
});

export default displaySlice.reducer;
