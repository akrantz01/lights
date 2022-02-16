import { createAction } from '@reduxjs/toolkit';

import { Color } from '../types';

interface SetPixelPayload {
  index: number;
  color: Color;
}

interface SetPixelRangePayload {
  start: number;
  end: number;
  color: Color;
}

interface SetArbitraryPixelsPayload {
  indexes: number[];
  color: Color;
}

// Strip actions
export const setBrightness = createAction<number>('server/strip/setBrightness');
export const turnOff = createAction('server/strip/off');
export const turnOn = createAction('server/strip/on');

// Display actions
export const applyPreset = createAction<string>('server/display/applyPreset');
export const setArbitraryPixels = createAction<SetArbitraryPixelsPayload>('server/display/setArbitraryPixels');
export const setColor = createAction<Color>('server/display/setColor');
export const setPixel = createAction<SetPixelPayload>('server/display/setPixel');
export const setPixelRange = createAction<SetPixelRangePayload>('server/display/setPixelRange');
export const startAnimation = createAction<string>('server/display/startAnimation');
export const stopAnimation = createAction('server/display/stopAnimation');
