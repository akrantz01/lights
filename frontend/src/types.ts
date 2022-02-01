export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Preset {
  name: string;
  pixels: Color[];
  brightness: number;
}

export enum ScheduleType {
  Fill = 1,
  Preset,
  Animation,
}

export enum ScheduleRepeats {
  Sunday = 1 << 0,
  Monday = 1 << 1,
  Tuesday = 1 << 2,
  Wednesday = 1 << 3,
  Thursday = 1 << 4,
  Friday = 1 << 5,
  Saturday = 1 << 6,
}

export interface Schedule {
  name: string;
  at: string;
  repeats: ScheduleRepeats;
  type: ScheduleType;
  color?: Color;
  preset?: string;
  animation?: string;
}
