import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Draft, nothing } from 'immer';

import { Animation, PartialPreset, PartialSchedule, Preset, Schedule } from '../types';

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

/**
 * The contents of a remove server-sent event
 */
interface RemoveEvent {
  id: string;
}

type MaybeDrafted<T> = T | Draft<T>;

const BASE_URL = process.env.REACT_APP_API_URL || '/';

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
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
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        // Connect to the event source
        const source = new EventSource(`${BASE_URL}/events?stream=animation`);

        try {
          // Wait for initial query
          await cacheDataLoaded;

          // Register handlers for creation, updates, and removal
          source.addEventListener('created', (e: Event) => {
            const data: Animation = JSON.parse((e as MessageEvent).data);
            updateCachedData((draft) => {
              // Only add if the preset does not already exist
              if (draft.filter((v) => v.id !== data.id).length === draft.length) draft.push(data);
            });
          });
          source.addEventListener('updated', (e) => {
            const data: UpdateAnimationArgs = JSON.parse((e as MessageEvent).data);
            updateCachedData((draft) => {
              const index = draft.findIndex((v) => v.id === data.id);
              if (index === undefined) return;
              draft[index] = { ...draft[index], ...data };
            });
          });
          source.addEventListener('removed', (e) => {
            const { id }: RemoveEvent = JSON.parse((e as MessageEvent).data);
            updateCachedData((draft) => draft.filter((v) => v.id !== id));
          });
        } catch {}

        // Close the event source when no longer active
        await cacheEntryRemoved;
        source.close();
      },
    }),
    getAnimation: builder.query<Animation, string>({
      query: (id) => `/animations/${id}`,
      transformResponse: (response: Response<Animation>) => response.data,
      providesTags: (result: Animation | undefined) =>
        result === undefined ? [] : [{ type: Tag.Animation, id: result.id }],
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        // Connect to the event source
        const source = new EventSource(`${BASE_URL}/events?stream=animation`);

        try {
          // Wait for initial query
          await cacheDataLoaded;

          // Register handlers for updates and removals
          source.addEventListener('updated', (e: Event) => {
            const data: UpdateAnimationArgs = JSON.parse((e as MessageEvent).data);
            if (data.id === arg) updateCachedData((draft) => ({ ...draft, ...data }));
          });
          source.addEventListener('removed', (e: Event) => {
            const { id }: RemoveEvent = JSON.parse((e as MessageEvent).data);
            // Ugly typecast to unset the data
            if (id === arg) updateCachedData(() => nothing as unknown as MaybeDrafted<Animation>);
          });
        } catch {}

        await cacheEntryRemoved;
        source.close();
      },
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
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        // Connect to the event source
        const source = new EventSource(`${BASE_URL}/events?stream=preset`);

        try {
          // Wait for initial query
          await cacheDataLoaded;

          // Register handlers for creation, updates, and removal
          source.addEventListener('created', (e: Event) => {
            const data: PartialPreset = JSON.parse((e as MessageEvent).data);
            updateCachedData((draft) => {
              // Only add if the preset does not already exist
              if (draft.filter((v) => v.id !== data.id).length === draft.length) draft.push(data);
            });
          });
          source.addEventListener('updated', (e) => {
            const data: UpdatePresetArgs = JSON.parse((e as MessageEvent).data);
            updateCachedData((draft) => {
              const index = draft.findIndex((v) => v.id === data.id);
              if (index === undefined) return;
              draft[index] = { ...draft[index], ...data };
            });
          });
          source.addEventListener('removed', (e) => {
            const { id }: RemoveEvent = JSON.parse((e as MessageEvent).data);
            updateCachedData((draft) => draft.filter((v) => v.id !== id));
          });
        } catch {}

        // Close the event source when no longer active
        await cacheEntryRemoved;
        source.close();
      },
    }),
    getPreset: builder.query<Preset, string>({
      query: (id) => `/presets/${id}`,
      transformResponse: (response: Response<Preset>) => response.data,
      providesTags: (result: Preset | undefined) => (result === undefined ? [] : [{ type: Tag.Preset, id: result.id }]),
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        // Connect to the event source
        const source = new EventSource(`${BASE_URL}/events?stream=preset`);

        try {
          // Wait for initial query
          await cacheDataLoaded;

          // Register handlers for updates and removals
          source.addEventListener('updated', (e: Event) => {
            const data: UpdatePresetArgs = JSON.parse((e as MessageEvent).data);
            if (data.id === arg) updateCachedData((draft) => ({ ...draft, ...data }));
          });
          source.addEventListener('removed', (e: Event) => {
            const { id }: RemoveEvent = JSON.parse((e as MessageEvent).data);
            // Ugly typecast to unset the data
            if (id === arg) updateCachedData(() => nothing as unknown as MaybeDrafted<Preset>);
          });
        } catch {}

        await cacheEntryRemoved;
        source.close();
      },
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
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        // Connect to the event source
        const source = new EventSource(`${BASE_URL}/events?stream=schedule`);

        try {
          // Wait for initial query
          await cacheDataLoaded;

          // Register handlers for creation, updates, and removal
          source.addEventListener('created', (e: Event) => {
            const data: PartialSchedule = JSON.parse((e as MessageEvent).data);
            updateCachedData((draft) => {
              // Only add if the preset does not already exist
              if (draft.filter((v) => v.id !== data.id).length === draft.length) draft.push(data);
            });
          });
          source.addEventListener('updated', (e) => {
            const data: UpdateScheduleArgs = JSON.parse((e as MessageEvent).data);
            updateCachedData((draft) => {
              const index = draft.findIndex((v) => v.id === data.id);
              if (index === undefined) return;
              draft[index] = { ...draft[index], ...data };
            });
          });
          source.addEventListener('removed', (e) => {
            const { id }: RemoveEvent = JSON.parse((e as MessageEvent).data);
            updateCachedData((draft) => draft.filter((v) => v.id !== id));
          });
        } catch {}

        // Close the event source when no longer active
        await cacheEntryRemoved;
        source.close();
      },
    }),
    getSchedule: builder.query<Schedule, string>({
      query: (id) => `/schedules/${id}`,
      transformResponse: (response: Response<Schedule>) => response.data,
      providesTags: (result: Schedule | undefined) =>
        result === undefined ? [] : [{ type: Tag.Schedule, id: result.id }],
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        // Connect to the event source
        const source = new EventSource(`${BASE_URL}/events?stream=schedule`);

        try {
          // Wait for initial query
          await cacheDataLoaded;

          // Register handlers for updates and removals
          source.addEventListener('updated', (e: Event) => {
            const data: UpdateScheduleArgs = JSON.parse((e as MessageEvent).data);
            if (data.id === arg) updateCachedData((draft) => ({ ...draft, ...data }));
          });
          source.addEventListener('removed', (e: Event) => {
            const { id }: RemoveEvent = JSON.parse((e as MessageEvent).data);
            // Ugly typecast to unset the data
            if (id === arg) updateCachedData(() => nothing as unknown as MaybeDrafted<Schedule>);
          });
        } catch {}

        await cacheEntryRemoved;
        source.close();
      },
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
  useGetAnimationQuery,
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
