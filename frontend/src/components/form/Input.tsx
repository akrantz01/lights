import React from 'react';

interface Props {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
}

const Input = ({ label, description, value, onChange }: Props): JSX.Element => {
  return (
    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
      <label htmlFor={`input-${label}`} className="block text-sm font-medium text-gray-700 sm:mt-px pt-2">
        Name
      </label>
      <div className="mt-1 sm:mt-0 sm:col-span-2">
        <input
          type="text"
          name={`input-${label}`}
          id={`input-${label}`}
          className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
          value={value}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        />
        {description && <p className="text-sm text-gray-500 mt-3">{description}</p>}
      </div>
    </div>
  );
};

export default Input;
