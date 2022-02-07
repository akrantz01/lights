import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Animation, Preset, PartialPreset, Schedule, PartialSchedule } from '../types';

/**
 * The tags used for caching elements
 */
enum Tag {
  Animation = 'animation',
  Preset = 'preset',
  Schedule = 'schedule',
}

/**
 * The arguments taken when creating an animation
 */
type CreateAnimationArgs = Pick<Animation, 'name'> & { wasm: File };

/**
 * The arguments taken when updating an animation
 */
type UpdateAnimationArgs = Pick<Animation, 'id'> & Partial<CreateAnimationArgs>;

/**
 * The arguments taken when updating a preset
 */
type UpdatePresetArgs = Pick<Preset, 'id'> & Partial<Omit<Preset, 'id'>>;

/**
 * The arguments taken when updating a schedule
 */
type UpdateScheduleArgs = Pick<Schedule, 'id'> & Partial<Omit<Schedule, 'id'>>;

/**
 * The generic response format for the API
 */
interface Response<T> {
  success: boolean;
  data: T;
}

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: process.env.REACT_APP_API_URL || '/' }),
  tagTypes: Object.values(Tag),
  endpoints: (builder) => ({
    // Animations API
    listAnimations: builder.query<Animation[], void>({
      query: () => '/animations',
      transformResponse: (response: Response<Animation[]>) => response.data,
      providesTags: (result: Animation[] = []) => [
        Tag.Animation,
        ...result.map((a) => ({ type: Tag.Animation, id: a.id })),
      ],
    }),
    createAnimation: builder.mutation<void, CreateAnimationArgs>({
      query: ({ name, wasm }) => {
        const body = new FormData();
        body.set('name', name);
        body.set('wasm', wasm);

        return {
          url: `/animations`,
          method: 'POST',
          body,
        };
      },
      invalidatesTags: [Tag.Animation],
    }),
    updateAnimation: builder.mutation<void, UpdateAnimationArgs>({
      query: ({ id, name, wasm }) => {
        const body = new FormData();
        if (name) body.set('name', name);
        if (wasm) body.set('wasm', wasm);

        return {
          url: `/animations/${id}`,
          method: 'PATCH',
          body,
        };
      },
      invalidatesTags: (result, error, arg) => [Tag.Animation, { type: Tag.Animation, id: arg.id }],
    }),
    removeAnimation: builder.mutation<void, string>({
      query: (name) => ({
        url: `/animations/${name}`,
        method: 'DELETE',
      }),
      invalidatesTags: [Tag.Animation],
    }),

    // Presets API
    listPresets: builder.query<PartialPreset[], void>({
      query: () => '/presets',
      transformResponse: (response: Response<PartialPreset[]>) => response.data,
      providesTags: (result: PartialPreset[] = []) => [
        Tag.Preset,
        ...result.map((preset) => ({ type: Tag.Preset, id: preset.id })),
      ],
    }),
    getPreset: builder.query<Preset, string>({
      query: (id) => `/presets/${id}`,
      transformResponse: (response: Response<Preset>) => response.data,
      providesTags: (result: Preset | undefined) => (result === undefined ? [] : [{ type: Tag.Preset, id: result.id }]),
    }),
    createPreset: builder.mutation<void, Omit<Preset, 'id'>>({
      query: (preset) => ({
        url: '/presets',
        method: 'POST',
        body: preset,
      }),
      invalidatesTags: [Tag.Preset],
    }),
    updatePreset: builder.mutation<void, UpdatePresetArgs>({
      query: (preset) => ({
        url: `/presets/${preset.id}`,
        method: 'PATCH',
        body: preset,
      }),
      invalidatesTags: (result, error, arg) => [Tag.Preset, { type: Tag.Preset, id: arg.id }],
    }),
    removePreset: builder.mutation<void, string>({
      query: (id) => ({
        url: `/presets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => [Tag.Preset, { type: Tag.Preset, id: arg }],
    }),

    // Schedules API
    listSchedules: builder.query<PartialSchedule[], void>({
      query: () => '/schedules',
      transformResponse: (response: Response<PartialSchedule[]>) => response.data,
      providesTags: (result: PartialSchedule[] = []) => [
        Tag.Schedule,
        ...result.map((schedule) => ({ type: Tag.Schedule, id: schedule.id })),
      ],
    }),
    getSchedule: builder.query<Schedule, string>({
      query: (id) => `/schedules/${id}`,
      transformResponse: (response: Response<Schedule>) => response.data,
      providesTags: (result: Schedule | undefined) =>
        result === undefined ? [] : [{ type: Tag.Schedule, id: result.id }],
    }),
    createSchedule: builder.mutation<void, Omit<Schedule, 'id'>>({
      query: (schedule) => ({
        url: '/schedules',
        method: 'POST',
        body: schedule,
      }),
      invalidatesTags: [Tag.Schedule],
    }),
    updateSchedule: builder.mutation<void, UpdateScheduleArgs>({
      query: (schedule) => ({
        url: `/schedules/${schedule.id}`,
        method: 'PATCH',
        body: schedule,
      }),
      invalidatesTags: (result, error, arg) => [Tag.Schedule, { type: Tag.Schedule, id: arg.id }],
    }),
    toggleSchedule: builder.mutation<void, string>({
      query: (id) => ({
        url: `/schedules/${id}/toggle`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, arg) => [Tag.Schedule, { type: Tag.Schedule, id: arg }],
    }),
    removeSchedule: builder.mutation<void, string>({
      query: (id) => ({
        url: `/schedules/${id}`,
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
  useCreateAnimationMutation,
  useUpdateAnimationMutation,
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
  useToggleScheduleMutation,
  useRemoveScheduleMutation,
} = api;
