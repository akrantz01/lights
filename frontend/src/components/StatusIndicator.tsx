import React from 'react';
import { useSelector } from '../store';
import classNames from 'classnames';

const StatusIndicator = (): JSX.Element => {
  const { connected, reconnecting } = useSelector((state) => state.ws);

  const text = connected ? 'Connected' : reconnecting ? 'Reconnecting...' : 'Disconnected';

  return (
    <div className="has-tooltip">
      <span className="tooltip rounded shadow-lg p-1 bg-gray-100 mt-8 -ml-24 md:-ml-5">{text}</span>
      <span className="relative inline-flex">
        <span className="flex absolute h-3 w-3 -top-1 right-3 md:right-6">
          <span
            className={classNames(
              'absolute inline-flex h-full w-full rounded-full opacity-75 transition-colors ease-in-out duration-500',
              {
                'animate-ping': reconnecting,
                'bg-green-600': connected,
                'bg-red-700': !connected,
              },
            )}
          />
          <span
            className={classNames(
              'relative inline-flex rounded-full h-3 w-3 transition-colors ease-in-out duration-500',
              {
                'bg-green-600': connected,
                'bg-red-700': !connected,
              },
            )}
          />
        </span>
      </span>
    </div>
  );
};
export default StatusIndicator;
