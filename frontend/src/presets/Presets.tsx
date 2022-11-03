import { RectangleStackIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon } from '@heroicons/react/24/solid';
import React from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/Button';
import Card from '../components/Card';
import ListView from '../components/ListView';
import { Scope, applyPreset, hasPermission, useDispatch, useListPresetsQuery, useSelector } from '../store';

const Presets = () => {
  const dispatch = useDispatch();
  const { data: presets, isLoading, isFetching, refetch } = useListPresetsQuery();
  const currentPreset = useSelector((state) => state.display.preset || '');

  const canApply = useSelector(hasPermission(Scope.CONTROL_LIGHTS));
  const canCreate = useSelector(hasPermission(Scope.EDIT));

  const apply = (name: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dispatch(applyPreset(name));
  };

  return (
    <Card>
      <ListView
        isLoading={isLoading}
        isFetching={isFetching}
        refetch={refetch}
        items={presets}
        typeName="preset"
        icon={RectangleStackIcon}
        canCreate={canCreate}
      >
        {(item) => (
          <li key={item.id}>
            <Link to={`/presets/${item.id}`} className="block hover:bg-gray-50">
              <div className="px-4 py-4 flex items-center sm:px-6">
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{item.name}</p>
                  <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                    <Button
                      onClick={apply(item.id)}
                      style="secondary"
                      disabled={!canApply || item.id === currentPreset}
                    >
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
    </Card>
  );
};
export default Presets;
