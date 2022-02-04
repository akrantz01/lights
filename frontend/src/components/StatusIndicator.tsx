import React from 'react';
import { StatusOfflineIcon, StatusOnlineIcon } from '@heroicons/react/outline';
import classNames from 'classnames';

import { useSelector } from '../store';

const StatusIndicator = (): JSX.Element => {
  const { connected, reconnecting } = useSelector((state) => state.ws);

  const text = connected ? 'Connected' : reconnecting ? 'Reconnecting...' : 'Disconnected';

  const iconClasses = classNames(
    'relative inline-flex rounded-full h-5 w-5 transition-colors ease-in-out duration-500',
    {
      'text-green-600': connected,
      'text-red-700': !connected,
    },
  );

  return (
    <div className="has-tooltip">
      <span className="tooltip rounded shadow-lg p-1 bg-gray-100 mt-8 -ml-24 md:-ml-5">{text}</span>
      <span className="relative inline-flex">
        <span className="flex absolute h-5 w-5 -top-2 md:-top-3 right-3 md:right-6">
          <span
            className={classNames(
              'absolute inline-flex h-full w-full rounded-full opacity-75 transition-colors ease-in-out duration-500 animate-ping',
              {
                'bg-red-700': !reconnecting,
                'bg-amber-300': reconnecting,
                hidden: connected,
              },
            )}
          />
          {connected ? <StatusOnlineIcon className={iconClasses} /> : <StatusOfflineIcon className={iconClasses} />}
        </span>
      </span>
    </div>
  );
};
export default StatusIndicator;
