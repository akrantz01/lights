import React from 'react';
import { FilmIcon } from '@heroicons/react/outline';
import { ChevronRightIcon } from '@heroicons/react/solid';
import { Link, RouteComponentProps } from '@reach/router';

import Button from '../components/Button';
import ListView from '../components/ListView';
import { startAnimation, stopAnimation, useDispatch, useListAnimationsQuery, useSelector } from '../store';
import { Type } from '../store/display';

const Animations: React.FC<RouteComponentProps> = () => {
  const dispatch = useDispatch();
  const { data: animations, isLoading, isFetching, refetch } = useListAnimationsQuery();

  const isAnimationRunning = useSelector(
    (state) => state.display.type === Type.Animation && state.display.animation?.running,
  );

  const apply = (name: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dispatch(startAnimation(name));
  };

  return (
    <>
      <ListView
        isLoading={isLoading}
        isFetching={isFetching}
        refetch={refetch}
        items={animations}
        icon={FilmIcon}
        typeName="animation"
      >
        {(item) => (
          <li key={item}>
            <Link to={`/animations/${item}`} className="block hover:bg-gray-50">
              <div className="px-4 py-4 flex items-center sm:px-6">
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{item}</p>
                  <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                    <Button onClick={apply(item)} style="secondary">
                      Start
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
      <Button
        className="mt-3 text-white bg-red-400 disabled:bg-red-300 hover:bg-red-300"
        disabled={!isAnimationRunning}
        onClick={() => dispatch(stopAnimation())}
      >
        Stop current animation
      </Button>
    </>
  );
};

export default Animations;
