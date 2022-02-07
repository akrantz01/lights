import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { ClockIcon } from '@heroicons/react/outline';

import Button from '../components/Button';
import { BitwiseCheckbox, ColorInput, Dropdown, Input, TimeInput } from '../components/form';
import { CreateModalProps } from '../components/ListView';
import ModalBase from '../components/ModalBase';
import { useCreateScheduleMutation, useListAnimationsQuery, useListPresetsQuery } from '../store';
import { Color, ScheduleRepeats, ScheduleType } from '../types';

const CreateModal = ({ open, close }: CreateModalProps): JSX.Element => {
  const cancelButtonRef = useRef(null);
  const [createSchedule, { isLoading }] = useCreateScheduleMutation();

  // Get lists of all presets and animations
  const { data: animations, isLoading: isAnimationsLoading } = useListAnimationsQuery();
  const { data: presets, isLoading: isPresetsLoading } = useListPresetsQuery();

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

  const onSubmit = () => {
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
    close();
  };

  return (
    <ModalBase open={open} close={close} initialFocus={cancelButtonRef}>
      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
              <ClockIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-4 text-left w-full">
              <Dialog.Title as="h3" className="text-center sm:text-left text-lg leading-6 font-medium text-gray-900">
                Create schedule
              </Dialog.Title>
              <form className="mt-2 space-y-8 divide-y divide-gray-200">
                <div className="space-y-6 divide-y divide-gray-200 sm:space-y-5">
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
                  <Dropdown
                    label="Type"
                    options={['Fill', 'Preset', 'Animation']}
                    values={[ScheduleType.Fill, ScheduleType.Preset, ScheduleType.Animation]}
                    value={type}
                    onChange={(v) => setType(parseInt(v))}
                    description="Choose what gets displayed when the schedule runs."
                  />
                  {type === ScheduleType.Fill && <ColorInput label="Color" value={color} onChange={setColor} />}
                  {type === ScheduleType.Preset && (
                    <Dropdown
                      label="Preset"
                      options={(presets || []).map((p) => p.name)}
                      values={(presets || []).map((p) => p.id)}
                      value={preset}
                      onChange={setPreset}
                    />
                  )}
                  {type === ScheduleType.Animation && (
                    <Dropdown
                      label="Animation"
                      options={(animations || []).map((a) => a.name) || []}
                      values={(animations || []).map((a) => a.id) || []}
                      value={animation}
                      onChange={setAnimation}
                    />
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <Button
            style="success"
            className="w-full inline-flex justify-center sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onSubmit}
            disabled={isLoading}
          >
            Create
          </Button>
          <Button
            style="secondary"
            className="mt-3 w-full inline-flex justify-center sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={close}
            ref={cancelButtonRef}
          >
            Cancel
          </Button>
        </div>
      </div>
    </ModalBase>
  );
};

export default CreateModal;
