import { Switch } from '@headlessui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import React from 'react';

interface Props {
  enabled: boolean;
  onChange: () => void;
  large?: boolean;
  disabled?: boolean;
}

const Toggle = ({ enabled, onChange, large = false, disabled = false }: Props): JSX.Element => (
  <Switch
    checked={enabled}
    onChange={onChange}
    className={classNames(
      enabled ? (disabled ? 'bg-indigo-400' : 'bg-indigo-600') : 'bg-gray-300',
      large ? 'h-9 w-20' : 'h-6 w-11',
      'relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
    )}
    disabled={disabled}
  >
    <span className="sr-only">Change enabled state</span>
    <span
      className={classNames(
        enabled ? (large ? 'translate-x-11' : 'translate-x-5') : 'translate-x-0',
        large ? 'h-8 w-8' : 'h-5 w-5',
        disabled ? 'bg-gray-100' : 'bg-white',
        'pointer-events-none relative inline-block rounded-full shadow transform ring-0 transition ease-in-out duration-200',
      )}
    >
      <span
        className={classNames(
          enabled ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200',
          'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity',
        )}
        aria-hidden="true"
      >
        <XMarkIcon className="h-5 w-5 text-gray-400" />
      </span>
      <span
        className={classNames(
          enabled ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100',
          'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity',
        )}
        aria-hidden="true"
      >
        <CheckIcon className="h-5 w-5 text-gray-400" />
      </span>
    </span>
  </Switch>
);

export default Toggle;
