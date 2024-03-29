import { ArrowPathIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import React from 'react';
import { Link } from 'react-router-dom';

import { stopAnimation, useDispatch, useGetAnimationQuery, useSelector } from '../store';

interface Props {
  disabled?: boolean;
}

const Animation = ({ disabled }: Props): JSX.Element => {
  const dispatch = useDispatch();
  const animation = useSelector((state) => state.display.animation);
  const { data, isLoading } = useGetAnimationQuery(animation.id !== undefined ? animation.id : '');

  if (isLoading || data === undefined) {
    return (
      <div className="mt-3 pt-12 pb-6 text-center">
        <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div>
        <p className="max-w-2xl text-sm text-gray-600">
          Manage the details from the{' '}
          <Link to="/animations" className="text-blue-500 hover:underline">
            animations
          </Link>{' '}
          tab
        </p>
      </div>
      <div className="mt-5 border-t border-b border-gray-300">
        <dl className="sm:divide-y sm:divide-gray-300">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Running</dt>
            <dd className="mt-1 flex text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span className="flex-grow">{animation.running ? 'Yes' : 'No'}</span>
              <span className="ml-4 flex-shrink-0">
                {animation.running && (
                  <button
                    type="button"
                    onClick={() => dispatch(stopAnimation())}
                    className={classNames(
                      disabled ? 'text-red-400' : 'text-red-600 hover:text-red-500',
                      'mr-3 bg-gray-200 rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
                    )}
                    disabled={disabled}
                  >
                    Stop
                  </button>
                )}
              </span>
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 flex text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {animation.id !== undefined ? data.name : 'No animation running'}
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
};

export default Animation;
