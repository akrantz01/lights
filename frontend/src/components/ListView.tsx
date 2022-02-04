import React, { ComponentType, useState } from 'react';
import { PlusIcon, RefreshIcon } from '@heroicons/react/outline';
import classNames from 'classnames';

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
  modal?: ComponentType<CreateModalProps>;
}

const ListView = <T,>({
  children,
  items,
  isFetching,
  isLoading,
  refetch,
  icon: Icon,
  typeName,
  modal: Modal,
}: Props<T>) => {
  // Set up the create modal
  const [createIsOpen, setCreateOpen] = useState(false);
  const modal = Modal !== undefined && <Modal open={createIsOpen} close={() => setCreateOpen(false)} />;

  const createButton = (
    <Button onClick={() => setCreateOpen(true)}>
      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
      New {typeName}
    </Button>
  );
  const header = (
    <div className="flex items-center justify-between">
      {createButton}
      <Button onClick={refetch} style="secondary" disabled={isFetching}>
        <RefreshIcon
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
        <RefreshIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
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
        {modal}
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
      {modal}
    </>
  );
};

export default ListView;
