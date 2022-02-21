import React from 'react';

import { BaseProps } from './props';

const BaseSlider = ({ value, onChange, ...props }: BaseProps<number>) => {
  return (
    <div className="relative">
      <input
        className="w-full"
        id={props.id}
        name={props.name}
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(parseInt((event.target as HTMLInputElement).value))}
        disabled={props.disabled}
      />
      <span
        className="text-sm mt-6 px-1 py-0.5 absolute rounded translate-x-2/4 bg-indigo-300"
        style={{ left: `calc(${value}% - ${20 + value * 0.3}px)` }}
      >
        {value}%
      </span>
    </div>
  );
};

interface Props extends BaseProps<number> {
  label: string;
  description?: string;
}

const Slider = ({ label, description, value, onChange }: Props): JSX.Element => (
  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-300 sm:pt-5">
    <label htmlFor={`slider-${label}`} className="block text-sm font-medium text-gray-700 sm:mt-px pt-2">
      {label}
    </label>
    <div className="mt-1 sm:mt-0 sm:col-span-2">
      <BaseSlider value={value} onChange={onChange} />
      {description && <p className="text-sm text-gray-500 mt-3">{description}</p>}
    </div>
  </div>
);

export { BaseSlider, Slider };
