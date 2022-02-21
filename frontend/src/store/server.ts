import { createAction } from '@reduxjs/toolkit';

import { Color } from '../types';

interface SetArbitraryPixelsPayload {
  indexes: number[];
  color: Color;
}

// Authentication actions
export const login = createAction<string>('server/authentication/login');
export const logout = createAction('server/authentication/logout');

// Strip actions
export const setBrightness = createAction<number>('server/strip/setBrightness');
export const turnOff = createAction('server/strip/off');
export const turnOn = createAction('server/strip/on');

// Display actions
export const applyPreset = createAction<string>('server/display/applyPreset');
export const setPixels = createAction<SetArbitraryPixelsPayload>('server/display/setPixels');
export const setColor = createAction<Color>('server/display/setColor');
export const startAnimation = createAction<string>('server/display/startAnimation');
export const stopAnimation = createAction('server/display/stopAnimation');
