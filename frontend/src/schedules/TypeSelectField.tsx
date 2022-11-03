import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { RGBColor } from 'react-color';
import { Link } from 'react-router-dom';

import { BaseColorInput, BaseDropdown } from '../components/form';
import { useGetAnimationQuery, useGetPresetQuery, useListAnimationsQuery, useListPresetsQuery } from '../store';
import { ScheduleType } from '../types';

interface DropdownProps {
  value: string;
  onChange: (v: string) => void;
}

interface LinkProps {
  value: string;
}

const AnimationDropdown = ({ value, onChange }: DropdownProps) => {
  const { data = [], isLoading } = useListAnimationsQuery();
  const options = data.reduce((o, a) => ({ ...o, [a.name]: a.id }), {});

  useEffect(() => onChange(data.length === 0 ? '' : data[0].id), [data]);

  if (isLoading) return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
  return <BaseDropdown options={options} value={value} onChange={onChange} />;
};

const AnimationLink = ({ value }: LinkProps) => {
  const { data, isLoading } = useGetAnimationQuery(value);

  if (isLoading) return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
  return (
    <Link to={`/animations/${value}`} className="text-blue-600 hover:text-blue-800 hover:underline">
      {data?.name}
    </Link>
  );
};

const PresetDropdown = ({ value, onChange }: DropdownProps) => {
  const { data = [], isLoading } = useListPresetsQuery();
  const options = data.reduce((o, p) => ({ ...o, [p.name]: p.id }), {});

  useEffect(() => onChange(data.length === 0 ? '' : data[0].id), [data]);

  if (isLoading) return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
  return <BaseDropdown options={options} value={value} onChange={onChange} />;
};

const PresetLink = ({ value }: LinkProps) => {
  const { data, isLoading } = useGetPresetQuery(value);

  if (isLoading) return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
  return (
    <Link to={`/presets/${value}`} className="text-blue-600 hover:text-blue-800 hover:underline">
      {data?.name}
    </Link>
  );
};

interface Props {
  value: string | RGBColor;
  type: ScheduleType;
  onSave: (type: ScheduleType, value: string | RGBColor) => void;
  editable?: boolean;
}

const TypeSelectField = ({ onSave, value: initialValue, type: initialType, editable }: Props) => {
  const [isUpdating, setUpdating] = useState(false);
  const [type, setType] = useState(initialType);
  const [value, setValue] = useState(initialValue);

  // Handle toggling the update state
  const onToggleUpdate = () => {
    if (isUpdating) onSave(type, value);
    setUpdating(!isUpdating);
  };

  // Handle cancelling the update
  const onCancel = () => {
    setType(initialType);
    setValue(initialValue);
    setUpdating(false);
  };

  return (
    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">
        {isUpdating && (
          <BaseDropdown
            options={{
              Fill: ScheduleType.Fill,
              Preset: ScheduleType.Preset,
              Animation: ScheduleType.Animation,
            }}
            value={type}
            onChange={(v) => setType(parseInt(v))}
          />
        )}
        {!isUpdating && ScheduleType[type]}
      </dt>
      <dd className="mt-1 flex text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        <span className="flex-grow">
          {isUpdating && type === ScheduleType.Fill && <BaseColorInput value={value as RGBColor} onChange={setValue} />}
          {!isUpdating && type === ScheduleType.Fill && (
            <span
              className="w-16 h-6 inline-block rounded"
              style={{
                background: `rgb(${(value as RGBColor).r}, ${(value as RGBColor).g}, ${(value as RGBColor).b})`,
              }}
            />
          )}

          {isUpdating && type === ScheduleType.Preset && <PresetDropdown value={value as string} onChange={setValue} />}
          {!isUpdating && type === ScheduleType.Preset && <PresetLink value={value as string} />}

          {isUpdating && type === ScheduleType.Animation && (
            <AnimationDropdown value={value as string} onChange={setValue} />
          )}
          {!isUpdating && type === ScheduleType.Animation && <AnimationLink value={value as string} />}
        </span>
        <span className="ml-4 flex-shrink-0">
          {isUpdating && (
            <>
              <button
                type="button"
                className="mr-3 bg-gray-200 rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={onCancel}
              >
                Cancel
              </button>
              <span className="text-gray-500 font-bold mr-3" aria-hidden="true">
                |
              </span>
            </>
          )}
          {editable && (
            <button
              type="button"
              className="bg-gray-200 rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onToggleUpdate}
            >
              {isUpdating && 'Save'}
              {!isUpdating && 'Update'}
            </button>
          )}
        </span>
      </dd>
    </div>
  );
};

export default TypeSelectField;
