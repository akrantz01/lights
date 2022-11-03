import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Link, RouteComponentProps, useNavigate } from '@reach/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import Button from '../components/Button';
import Card from '../components/Card';
import { BitwiseCheckbox, ColorInput, Dropdown, Input, TimeInput } from '../components/form';
import {
  Scope,
  hasPermission,
  useCreateScheduleMutation,
  useListAnimationsQuery,
  useListPresetsQuery,
  useSelector,
} from '../store';
import { Color, ScheduleRepeats, ScheduleType } from '../types';

const NewSchedule: React.FC<RouteComponentProps> = (): JSX.Element => {
  const navigate = useNavigate();
  const [createSchedule, { isLoading, isUninitialized, isError }] = useCreateScheduleMutation();

  // Get lists of all presets and animations
  const { data: animations, isLoading: isAnimationsLoading } = useListAnimationsQuery();
  const { data: presets, isLoading: isPresetsLoading } = useListPresetsQuery();

  const canCreate = useSelector(hasPermission(Scope.EDIT));

  // Track form state
  const [name, setName] = useState('');
  const [at, setAt] = useState('');
  const [repeats, setRepeats] = useState(0);
  const [type, setType] = useState(ScheduleType.Fill);
  const [color, setColor] = useState<Color>({ r: 0, g: 0, b: 0 });
  const [preset, setPreset] = useState('');
  const [animation, setAnimation] = useState('');

  // Populate the initial value for preset and animation
  useEffect(
    () => setAnimation(animations !== undefined && animations.length !== 0 ? animations[0].id : ''),
    [isAnimationsLoading],
  );
  useEffect(() => setPreset(presets !== undefined && presets.length !== 0 ? presets[0].id : ''), [isPresetsLoading]);

  // Automatically navigate away when the action finishes
  useEffect(() => {
    if (!isUninitialized && !isLoading && !isError) {
      toast.success(`Created schedule '${name}'`);
      navigate('/schedules').catch(console.error);
    }
  }, [isLoading]);

  const onSubmit = async () =>
    createSchedule({
      name,
      at,
      enabled: true,
      repeats,
      type,
      color,
      preset,
      animation,
    });

  return (
    <Card>
      <form className="space-y-8 divide-y divide-gray-300">
        <div className="space-y-8 divide-y divide-gray-300 sm:space-y-5">
          <div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Schedule</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Descriptive information about the schedule</p>
            </div>
            <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
              <Input label="Name" value={name} onChange={setName} />
              <TimeInput
                label="Run at"
                onChange={setAt}
                description="Set when the schedule will be run during the day"
              />
              <BitwiseCheckbox
                label="Repeats"
                description="Select when the schedule should repeat each week. If no days are selected, the schedule only be triggered once."
                options={{
                  Sunday: ScheduleRepeats.Sunday,
                  Monday: ScheduleRepeats.Monday,
                  Tuesday: ScheduleRepeats.Tuesday,
                  Wednesday: ScheduleRepeats.Wednesday,
                  Thursday: ScheduleRepeats.Thursday,
                  Friday: ScheduleRepeats.Friday,
                  Saturday: ScheduleRepeats.Saturday,
                }}
                value={repeats}
                onChange={setRepeats}
              />
            </div>
          </div>
        </div>

        <div className="pt-8 space-y-6 sm:pt-10 sm:space-y-5">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Action</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Decide what should happen when the schedule is triggered.
            </p>
          </div>
          <div className="space-y-6 sm:space-y-5">
            <Dropdown
              label="Type"
              options={{
                Fill: ScheduleType.Fill,
                Preset: ScheduleType.Preset,
                Animation: ScheduleType.Animation,
              }}
              value={type}
              onChange={(v) => setType(parseInt(v))}
              description="Choose what gets displayed when the schedule runs."
            />
            {type === ScheduleType.Fill && <ColorInput label="Color" value={color} onChange={setColor} />}
            {type === ScheduleType.Preset && (
              <Dropdown
                label="Preset"
                options={(presets || []).reduce((o, p) => ({ ...o, [p.name]: p.id }), {})}
                value={preset}
                onChange={setPreset}
              />
            )}
            {type === ScheduleType.Animation && (
              <Dropdown
                label="Animation"
                options={(animations || []).reduce((o, a) => ({ ...o, [a.name]: a.id }), {})}
                value={animation}
                onChange={setAnimation}
              />
            )}
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <Link
              to="/schedules"
              className="px-4 py-2 text-sm rounded-md text-indigo-700 bg-indigo-100 disabled:bg-indigo-200 hover:bg-indigo-200 inline-flex items-center border border-transparent font-medium shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
            >
              Cancel
            </Link>
            <Button style="primary" className="ml-2" onClick={onSubmit} disabled={!canCreate || isLoading}>
              {!isLoading && 'Create'}
              {isLoading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default NewSchedule;
