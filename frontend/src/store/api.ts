import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Preset, Schedule } from '../types';

/**
 * The tags used for caching elements
 */
enum Tag {
  Animation = 'animation',
  Preset = 'preset',
  Schedule = 'schedule',
}

/**
 * The arguments taken when creating/updating an animation
 */
interface UpsertAnimationArgs {
  name: string;
  wasm: File;
}

/**
 * The arguments taken when updating a preset
 */
type UpdatePresetArgs = Pick<Preset, 'name'> & Partial<Omit<Preset, 'name'>>;

/**
 * The arguments taken when updating a schedule
 */
type UpdateScheduleArgs = Pick<Schedule, 'name'> & Partial<Omit<Schedule, 'name'>>;

/**
 * The generic response format for the API
 */
interface Response<T> {
  success: boolean;
  data: T;
}

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: Object.values(Tag),
  endpoints: (builder) => ({
    // Animations API
    listAnimations: builder.query<string[], void>({
      query: () => '/animations',
      transformResponse: (response: { data: Response<string[]> }) => response.data.data,
      providesTags: [Tag.Animation],
    }),
    upsertAnimation: builder.mutation<void, UpsertAnimationArgs>({
      query: ({ name, wasm }) => {
        const body = new FormData();
        body.set('wasm', wasm);

        return {
          url: `/animations/${name}`,
          method: 'PUT',
          body: body,
        };
      },
      invalidatesTags: [Tag.Animation],
    }),
    removeAnimation: builder.mutation<void, string>({
      query: (name) => ({
        url: `/animations/${name}`,
        method: 'DELETE',
      }),
      invalidatesTags: [Tag.Animation],
    }),

    // Presets API
    listPresets: builder.query<string[], void>({
      query: () => '/presets',
      transformResponse: (response: { data: Response<string[]> }) => response.data.data,
      providesTags: (result: string[] = []) => [Tag.Preset, ...result.map((name) => ({ type: Tag.Preset, id: name }))],
    }),
    getPreset: builder.query<Preset, string>({
      query: (name) => `/presets/${name}`,
      transformResponse: (response: { data: Response<Preset> }) => response.data.data,
      providesTags: (result: Preset | undefined) =>
        result === undefined ? [] : [{ type: Tag.Preset, id: result.name }],
    }),
    createPreset: builder.mutation<void, Preset>({
      query: (preset) => ({
        url: '/animations',
        method: 'POST',
        body: preset,
      }),
      invalidatesTags: [Tag.Preset],
    }),
    updatePreset: builder.mutation<void, UpdatePresetArgs>({
      query: (preset) => ({
        url: `/animations/${preset.name}`,
        method: 'PUT',
        body: preset,
      }),
      invalidatesTags: (result, error, arg) => [{ type: Tag.Preset, id: arg.name }],
    }),
    removePreset: builder.mutation<void, string>({
      query: (name) => ({
        url: `/animations/${name}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => [Tag.Preset, { type: Tag.Preset, id: arg }],
    }),

    // Schedules API
    listSchedules: builder.query<string[], void>({
      query: () => '/schedules',
      transformResponse: (response: { data: Response<string[]> }) => response.data.data,
      providesTags: (result: string[] = []) => [
        Tag.Schedule,
        ...result.map((name) => ({ type: Tag.Schedule, id: name })),
      ],
    }),
    getSchedule: builder.query<Schedule, string>({
      query: (name) => `/schedules/${name}`,
      transformResponse: (response: { data: Response<Schedule> }) => response.data.data,
      providesTags: (result: Schedule | undefined) =>
        result === undefined ? [] : [{ type: Tag.Schedule, id: result.name }],
    }),
    createSchedule: builder.mutation<void, Schedule>({
      query: (schedule) => ({
        url: '/schedules',
        method: 'POST',
        body: schedule,
      }),
      invalidatesTags: [Tag.Schedule],
    }),
    updateSchedule: builder.mutation<void, UpdateScheduleArgs>({
      query: (schedule) => ({
        url: `/schedules/${schedule.name}`,
        method: 'PUT',
        body: schedule,
      }),
      invalidatesTags: (result, error, arg) => [{ type: Tag.Schedule, id: arg.name }],
    }),
    removeSchedule: builder.mutation<void, string>({
      query: (name) => ({
        url: `/schedules/${name}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => [Tag.Schedule, { type: Tag.Schedule, id: arg }],
    }),
  }),
});
export default api;

// Independently export the hooks
export const {
  useListAnimationsQuery,
  useUpsertAnimationMutation,
  useRemoveAnimationMutation,
  useListPresetsQuery,
  useGetPresetQuery,
  useCreatePresetMutation,
  useUpdatePresetMutation,
  useRemovePresetMutation,
  useListSchedulesQuery,
  useGetScheduleQuery,
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
  useRemoveScheduleMutation,
} = api;
