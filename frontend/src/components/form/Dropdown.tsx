import React from 'react';

interface Props {
  label: string;
  description?: string;
  options: string[];
  values?: string[] | number[];
  value: string | number;
  onChange: (v: string) => void;
}

const Dropdown = ({ label, description, options, values, value, onChange }: Props): JSX.Element => {
  if (values !== undefined && values.length !== options.length) throw Error('lengths of options and values must match');

  return (
    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
      <label htmlFor={`dropdown-${label}`} className="block text-sm font-medium text-gray-700 sm:mt-px pt-2">
        {label}
      </label>
      <div className="mt-1 sm:mt-0 sm:col-span-2">
        <select
          id={`dropdown-${label}`}
          name={`dropdown-${label}`}
          className="max-w-lg block focus:ring-indigo-500 focus:border-indigo-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {values === undefined && options.map((name) => <option key={name}>{name}</option>)}
          {values !== undefined &&
            options.map((name, i) => (
              <option key={values[i]} value={values[i]}>
                {name}
              </option>
            ))}
        </select>
        {description && <p className="text-sm text-gray-500 mt-3">{description}</p>}
      </div>
    </div>
  );
};

export default Dropdown;
