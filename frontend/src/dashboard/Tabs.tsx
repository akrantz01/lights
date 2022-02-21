import classNames from 'classnames';
import React from 'react';

import { Type } from '../store/display';

const modes = {
  Fill: Type.Fill,
  Pixels: Type.Pixels,
  Animation: Type.Animation,
};

interface Props {
  selected: Type;
  onChange: (t: Type) => void;
  className?: string;
  disabled?: boolean;
}

const Tabs = ({ className, disabled, selected, onChange }: Props): JSX.Element => (
  <div className={className}>
    <div className="sm:hidden">
      <label htmlFor="tabs" className="sr-only">
        Select a display mode
      </label>
      <select
        id="tabs"
        name="tabs"
        value={selected}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="block w-full focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
        disabled={disabled}
      >
        {Object.entries(modes).map(([name, value]) => (
          <option key={name} value={value}>
            {name}
          </option>
        ))}
      </select>
    </div>
    <div className="hidden sm:block">
      <div className="relative z-0 rounded-lg shadow flex divide-x divide-gray-200" aria-label="Tabs">
        {Object.entries(modes).map(([name, value], index, a) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(value)}
            className={classNames(
              index === 0 ? 'rounded-l-lg' : '',
              index === a.length - 1 ? 'rounded-r-lg' : '',
              selected === value ? 'text-gray-900' : 'text-gray-500',
              !disabled && selected !== value ? 'hover:text-gray-700' : '',
              disabled ? '' : 'hover:bg-gray-50',
              'group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-4 text-sm font-medium text-center focus:z-10',
            )}
            disabled={disabled}
            aria-current={selected === value ? 'page' : undefined}
          >
            <span>{name}</span>
            <span
              aria-hidden="true"
              className={classNames(
                selected === value ? 'bg-indigo-500' : 'bg-transparent',
                'absolute inset-x-0 bottom-0 h-0.5',
              )}
            />
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default Tabs;
