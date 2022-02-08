import React from 'react';
import { CollectionIcon } from '@heroicons/react/outline';
import { ChevronRightIcon } from '@heroicons/react/solid';
import { Link, RouteComponentProps } from '@reach/router';

import Button from '../components/Button';
import ListView from '../components/ListView';
import { applyPreset, useDispatch, useListPresetsQuery, useSelector } from '../store';
import { Type } from '../store/display';

const Presets: React.FC<RouteComponentProps> = () => {
  const dispatch = useDispatch();
  const { data: presets, isLoading, isFetching, refetch } = useListPresetsQuery();
  const currentPreset = useSelector((state) =>
    state.display.type === Type.Preset ? (state.display.preset as string) : '',
  );

  const apply = (name: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dispatch(applyPreset(name));
  };

  return (
    <ListView
      isLoading={isLoading}
      isFetching={isFetching}
      refetch={refetch}
      items={presets}
      typeName="preset"
      icon={CollectionIcon}
    >
      {(item) => (
        <li key={item.id}>
          <Link to={`/presets/${item.id}`} className="block hover:bg-gray-50">
            <div className="px-4 py-4 flex items-center sm:px-6">
              <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">{item.name}</p>
                <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                  <Button onClick={apply(item.id)} style="secondary" disabled={item.id === currentPreset}>
                    {item.id === currentPreset ? 'Applied' : 'Apply'}
                  </Button>
                </div>
              </div>
              <div className="ml-5 flex-shrink-0">
                <ChevronRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
            </div>
          </Link>
        </li>
      )}
    </ListView>
  );
};
export default Presets;
