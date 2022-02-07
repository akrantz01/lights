import React from 'react';

import { BaseProps } from './props';

interface BaseDropdownProps extends BaseProps<string | number, string> {
  options: Record<string, string | number>;
}

const BaseDropdown = ({ options, value, onChange, id, name }: BaseDropdownProps): JSX.Element => (
  <select
    id={id}
    name={name}
    className="max-w-lg block focus:ring-indigo-500 focus:border-indigo-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    {Object.keys(options).map((l) => (
      <option key={l} value={options[l]}>
        {l}
      </option>
    ))}
  </select>
);

interface Props extends BaseDropdownProps {
  label: string;
  description?: string;
}

const Dropdown = ({ label, description, options, value, onChange }: Props): JSX.Element => (
  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
    <label htmlFor={`dropdown-${label}`} className="block text-sm font-medium text-gray-700 sm:mt-px pt-2">
      {label}
    </label>
    <div className="mt-1 sm:mt-0 sm:col-span-2">
      <BaseDropdown
        options={options}
        value={value}
        onChange={onChange}
        id={`dropdown-${label}`}
        name={`dropdown-${label}`}
      />
      {description && <p className="text-sm text-gray-500 mt-3">{description}</p>}
    </div>
  </div>
);

export { BaseDropdown, Dropdown };
