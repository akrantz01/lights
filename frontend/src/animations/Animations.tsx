import React, { useState } from 'react';
import { FilmIcon, PlayIcon, TrashIcon } from '@heroicons/react/outline';
import { RouteComponentProps } from '@reach/router';

import Button from '../components/Button';
import ListView from '../components/ListView';
import {
  startAnimation,
  stopAnimation,
  useDispatch,
  useListAnimationsQuery,
  useRemoveAnimationMutation,
  useSelector,
} from '../store';
import { Type } from '../store/display';
import DeleteConfirmation from '../components/DeleteConfirmation';

const Animations: React.FC<RouteComponentProps> = () => {
  const dispatch = useDispatch();
  const [deleteSelection, setDeleteSelection] = useState('');

  const { data: animations, isLoading, isFetching, refetch } = useListAnimationsQuery();
  const [removeAnimation] = useRemoveAnimationMutation();

  const isAnimationRunning = useSelector(
    (state) => state.display.type === Type.Animation && state.display.animation?.running,
  );

  const apply = (name: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dispatch(startAnimation(name));
  };
  const onDeleteCallback = () => {
    removeAnimation(deleteSelection);
    setDeleteSelection('');
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
            <div className="px-4 py-4 flex items-center sm:px-6">
              <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">{item}</p>
                <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                  <Button onClick={apply(item)} style="secondary" className="has-tooltip">
                    <span className="hidden md:inline tooltip rounded shadow-lg p-1 bg-gray-100 text-gray-900">
                      Start
                    </span>
                    <PlayIcon className="md:inline hidden -mx-1 h-5 w-5" />
                    <span className="md:hidden">Start</span>
                  </Button>
                  <Button onClick={() => setDeleteSelection(item)} style="danger" className="ml-3 has-tooltip">
                    <span className="hidden md:inline tooltip rounded shadow-lg p-1 bg-gray-100 text-gray-900">
                      Delete
                    </span>
                    <TrashIcon className="md:inline hidden -mx-1 h-5 w-5" />
                    <span className="md:hidden">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
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
      <DeleteConfirmation
        open={deleteSelection !== ''}
        close={() => setDeleteSelection('')}
        callback={onDeleteCallback}
        title="Delete animation"
        description="Are you sure you want to delete this animation? All of the associated data will be permanently removed from the server forver. If the animation is currently running, it will keep running until it is stopped."
      />
    </>
  );
};

export default Animations;