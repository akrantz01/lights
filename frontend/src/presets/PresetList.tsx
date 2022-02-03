import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/solid';
import { Link } from '@reach/router';
import classNames from 'classnames';

import { applyPreset, useDispatch } from '../store';

interface PresetListItemProps {
  name: string;
}

const PresetListItem = ({ name }: PresetListItemProps): JSX.Element => {
  const dispatch = useDispatch();

  const apply = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dispatch(applyPreset(name));
  };

  return (
    <li>
      <Link to={`/presets/${name}`} className="block hover:bg-gray-50">
        <div className="px-4 py-4 flex items-center sm:px-6">
          <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-indigo-600 truncate">{name}</p>
            <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-200 hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={apply}
              >
                Apply
              </button>
            </div>
          </div>
          <div className="ml-5 flex-shrink-0">
            <ChevronRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        </div>
      </Link>
    </li>
  );
};

interface Props {
  presets: string[];
  className?: string;
}

const PresetList = ({ presets, className }: Props): JSX.Element => (
  <div className={classNames('bg-white shadow overflow-hidden sm:rounded-md', className)}>
    <ul role="list" className="divide-y divide-gray-200">
      {presets.map((preset) => (
        <PresetListItem key={preset} name={preset} />
      ))}
    </ul>
  </div>
);

export default PresetList;
