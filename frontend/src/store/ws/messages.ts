import { Action } from '@reduxjs/toolkit';

export enum MessageType {
  Configuration = 1,
  CurrentColor,
  SetColor,
  StripState,
  StateOn,
  StateOff,
  CurrentBrightness,
  SetBrightness,
  ModifiedPixels,
  SetPixel,
  SetRange,
  SetArbitrary,
  CurrentPixels,
  PresetUsed,
  ApplyPreset,
  AnimationStatus,
  StartAnimation,
  StopAnimation,
}
