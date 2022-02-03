import React from 'react';
import { CollectionIcon, PlusIcon, RefreshIcon } from '@heroicons/react/outline';
import { RouteComponentProps } from '@reach/router';
import classNames from 'classnames';

import { useListPresetsQuery } from '../store';
import PresetList from './PresetList';

const Presets: React.FC<RouteComponentProps> = () => {
  const { data: presets, isLoading, isFetching, refetch } = useListPresetsQuery();

  const createButton = (
    <button
      type="button"
      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
      New preset
    </button>
  );

  return (
    <>
      <div className="flex items-center justify-between">
        {createButton}
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-200 hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={refetch}
          disabled={isFetching}
        >
          <RefreshIcon
            className={classNames('-ml-1 mr-2 h-5 w-5', { 'animate-spin': isFetching || isLoading })}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>
      {presets !== undefined && presets.length !== 0 && <PresetList className="mt-3" presets={presets} />}
      {presets !== undefined && presets.length === 0 && (
        <div className="mt-3 border-2 border-gray-300 border-dashed rounded-lg p-12 text-center">
          <CollectionIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No presets</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new preset.</p>
          <div className="mt-6">{createButton}</div>
        </div>
      )}
      {isLoading && (
        <div className="mt-3 p-12 text-center">
          <RefreshIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
        </div>
      )}
    </>
  );
};
export default Presets;
