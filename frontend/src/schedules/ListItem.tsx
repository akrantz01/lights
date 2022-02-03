import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/solid';
import { Link } from '@reach/router';

interface Props {
  name: string;
}

const ListItem = ({ name }: Props): JSX.Element => (
  <li>
    <Link to={`/schedules/${name}`} className="block hover:bg-gray-50">
      <div className="px-4 py-4 flex items-center sm:px-6">
        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-indigo-600 truncate">{name}</p>
        </div>
        <div className="ml-5 flex-shrink-0">
          <ChevronRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      </div>
    </Link>
  </li>
);

export default ListItem;
