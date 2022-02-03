import React from 'react';
import { CollectionIcon, PlusIcon, RefreshIcon } from '@heroicons/react/outline';
import { RouteComponentProps } from '@reach/router';
import classNames from 'classnames';

import Button from '../components/Button';
import { useListPresetsQuery } from '../store';
import ListItem from './ListItem';

const Presets: React.FC<RouteComponentProps> = () => {
  const { data: presets, isLoading, isFetching, refetch } = useListPresetsQuery();

  const createButton = (
    <Button>
      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
      New preset
    </Button>
  );

  // Display loading spinner
  if (isLoading || presets === undefined) {
    return (
      <div className="mt-3 pt-12 pb-6 text-center">
        <RefreshIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Prompt creation if none exist
  if (presets.length === 0) {
    return (
      <div className="mt-3 border-2 border-gray-300 border-dashed rounded-lg p-12 text-center">
        <CollectionIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No presets</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new preset.</p>
        <div className="mt-6">{createButton}</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        {createButton}
        <Button onClick={refetch} secondary={true} disabled={isFetching}>
          <RefreshIcon
            className={classNames('-ml-1 mr-2 h-5 w-5', { 'animate-spin': isFetching || isLoading })}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md mt-3">
        <ul role="list" className="divide-y divide-gray-200">
          {presets.map((preset) => (
            <ListItem key={preset} name={preset} />
          ))}
        </ul>
      </div>
    </>
  );
};
export default Presets;
