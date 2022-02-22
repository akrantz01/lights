import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface StripState {
  brightness: number;
  length: number;
  on: boolean;
}

const initialState: StripState = {
  brightness: 100,
  length: 150, // default strip length in .env
  on: true,
};

export const stripSlice = createSlice({
  name: 'strip',
  initialState,
  reducers: {
    setBrightness: (state, action: PayloadAction<number>) => {
      state.on = action.payload !== 0;
      state.brightness = action.payload;
    },
    setLength: (state, action: PayloadAction<number>) => {
      state.length = action.payload;
    },
    setState: (state, action: PayloadAction<boolean>) => {
      state.on = action.payload;
    },
  },
});

export default stripSlice.reducer;
