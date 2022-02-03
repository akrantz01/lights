import React from 'react';
import { Switch } from '@headlessui/react';
import { CheckIcon, XIcon } from '@heroicons/react/outline';
import classNames from 'classnames';

import { turnOff, turnOn, useDispatch, useSelector } from '../store';

const OnOffToggle = (): JSX.Element => {
  const dispatch = useDispatch();
  const on = useSelector((state) => state.strip.on);

  const onChange = () => dispatch(on ? turnOff() : turnOn());

  return (
    <Switch.Group>
      <div className="flex items-center justify-between">
        <Switch.Label className="text-2xl">Lights</Switch.Label>
        <Switch
          checked={on}
          onChange={onChange}
          className={classNames(
            on ? 'bg-indigo-600' : 'bg-gray-400',
            'relative inline-flex flex-shrink h-9 w-20 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
          )}
        >
          <span className="sr-only">Change state</span>
          <span
            className={classNames(
              on ? 'translate-x-11' : 'translate-x-0',
              'pointer-events-none relative inline-block h-8 w-8 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
            )}
          >
            <span
              className={classNames(
                on ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200',
                'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity',
              )}
              aria-hidden="true"
            >
              <XIcon className="h-5 w-5 text-gray-400" />
            </span>
            <span
              className={classNames(
                on ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100',
                'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity',
              )}
              aria-hidden="true"
            >
              <CheckIcon className="h-5 w-5 text-gray-400" />
            </span>
          </span>
        </Switch>
      </div>
    </Switch.Group>
  );
};
export default OnOffToggle;
