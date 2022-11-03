import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import React from 'react';
import { Link } from 'react-router-dom';

import Button from './Button';

export interface CreateModalProps {
  open: boolean;
  close: () => void;
}

interface Props<T> {
  children: (item: T) => React.ReactNode;
  items?: T[];
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  typeName: string;
  canCreate?: boolean;
}

const ListView = <T,>({
  children,
  items,
  isFetching,
  isLoading,
  refetch,
  icon: Icon,
  typeName,
  canCreate = true,
}: Props<T>) => {
  const createButton = (
    <Link
      to={'/new/' + typeName}
      className="px-4 py-2 text-sm rounded-md text-white bg-indigo-600 disabled:bg-indigo-600 hover:bg-indigo-700 inline-flex items-center border border-transparent font-medium shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
    >
      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
      New {typeName}
    </Link>
  );
  const header = (
    <div className="flex items-center justify-between">
      {canCreate ? createButton : '​' /* <- zero-width space for consistent formatting */}
      <Button onClick={refetch} style="secondary" disabled={isFetching}>
        <ArrowPathIcon
          className={classNames('-ml-1 mr-2 h-5 w-5', { 'animate-spin': isFetching || isLoading })}
          aria-hidden="true"
        />
        Refresh
      </Button>
    </div>
  );

  // Display loading spinner
  if (isLoading || items === undefined) {
    return (
      <div className="mt-3 pt-12 pb-6 text-center">
        <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Prompt creation if none exist
  if (items.length === 0) {
    return (
      <>
        {header}
        <div className="mt-3 border-2 border-gray-300 border-dashed rounded-lg p-12 text-center">
          <Icon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No {typeName}s</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new {typeName}.</p>
          <div className="mt-6">{createButton}</div>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="bg-white shadow overflow-hidden sm:rounded-md mt-3">
        <ul role="list" className="divide-y divide-gray-200">
          {items.map((item) => children(item))}
        </ul>
      </div>
    </>
  );
};

export default ListView;
