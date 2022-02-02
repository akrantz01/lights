import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Color } from '../types';

interface AnimationState {
  name?: string;
  running: boolean;
}

enum Type {
  Fill,
  Pixels,
  Preset,
  Animation,
}

interface DisplayState {
  animation?: AnimationState;
  fill?: Color;
  pixels?: Color[];
  preset?: string;
  type: Type;
}

const initialState: DisplayState = {
  type: Type.Fill,
  fill: {
    r: 0,
    g: 0,
    b: 0,
  },
};

export const displaySlice = createSlice({
  name: 'display',
  initialState,
  reducers: {
    setFill: (state, action: PayloadAction<Color>) => {
      state.type = Type.Fill;
      state.fill = action.payload;
    },
    setPixels: (state, action: PayloadAction<Color[]>) => {
      state.type = Type.Pixels;
      state.pixels = action.payload;
    },
    setPreset: (state, action: PayloadAction<string>) => {
      state.type = Type.Preset;
      state.preset = action.payload;
    },
    startAnimation: (state, action: PayloadAction<string>) => {
      state.type = Type.Animation;
      state.animation = {
        running: true,
        name: action.payload,
      };
    },
    stopAnimation: (state) => {
      state.type = Type.Animation;
      state.animation = {
        running: false,
      };
    },
  },
});

export const { setFill, setPixels, setPreset, startAnimation, stopAnimation } = displaySlice.actions;
export default displaySlice.reducer;