import React from 'react';
import { ClockIcon } from '@heroicons/react/outline';
import { ChevronRightIcon } from '@heroicons/react/solid';
import { Link, RouteComponentProps } from '@reach/router';

import ListView from '../components/ListView';
import { useListSchedulesQuery } from '../store';

const Schedules: React.FC<RouteComponentProps> = () => {
  const { data: schedules, isLoading, isFetching, refetch } = useListSchedulesQuery();

  return (
    <ListView
      items={schedules}
      isLoading={isLoading}
      isFetching={isFetching}
      refetch={refetch}
      icon={ClockIcon}
      typeName="schedule"
    >
      {(item) => (
        <li key={item}>
          <Link to={`/schedules/${item}`} className="block hover:bg-gray-50">
            <div className="px-4 py-4 flex items-center sm:px-6">
              <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">{item}</p>
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
export default Schedules;
