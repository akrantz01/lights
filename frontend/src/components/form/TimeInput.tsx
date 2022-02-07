import React from 'react';
import FlatPicker from 'react-flatpickr';

import { BaseProps } from './props';

type TimeBaseProps = Omit<BaseProps<string>, 'value'> & Partial<Pick<BaseProps<string>, 'value'>>;

const BaseTimeInput = ({ id, name, value, onChange }: TimeBaseProps): JSX.Element => (
  <FlatPicker
    value={value}
    options={{
      enableTime: true,
      noCalendar: true,
      altInput: true,
      altFormat: 'h:i K',
      dateFormat: 'H:i',
      ariaDateFormat: 'h:i K',
      static: true,
    }}
    id={id}
    name={name}
    className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
    onChange={(date, time) => onChange(time)}
  />
);

interface Props extends TimeBaseProps {
  label: string;
  description?: string;
}

const TimeInput = ({ label, description, value, onChange }: Props): JSX.Element => (
  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-300 sm:pt-5">
    <label htmlFor={`timepicker-${label}`} className="block text-sm font-medium text-gray-700 sm:mt-px pt-2">
      {label}
    </label>
    <div className="mt-1 sm:mt-0 sm:col-span-2">
      <BaseTimeInput onChange={onChange} value={value} />
      {description && <p className="text-sm text-gray-500 mt-3">{description}</p>}
    </div>
  </div>
);

export { BaseTimeInput, TimeInput };
