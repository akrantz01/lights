import React from 'react';
import { RouteComponentProps } from '@reach/router';
import classNames from 'classnames';

import { useSelector } from '../store';
import { Type } from '../store/display';
import BrightnessSlider from './BrightnessSlider';
import Pixels from './Pixels';
import OnOffToggle from './OnOffToggle';

const modes = {
  Fill: Type.Fill,
  Pixels: Type.Pixels,
  Preset: Type.Preset,
  Animation: Type.Animation,
};

const Dashboard: React.FC<RouteComponentProps> = () => {
  const displayMode = useSelector((state) => state.display.type);

  return (
    <>
      <div className="space-y-8 divide-y">
        <OnOffToggle />
        <BrightnessSlider className="border-t border-gray-300 pt-6" />
      </div>
      <div className="border-b border-gray-300 pt-12 mx-4 md:w-1/4">
        <div className="-mb-px flex space-x-6 px-2">
          {Object.entries(modes).map(([name, mode]) => (
            <span
              key={mode}
              className={classNames(
                displayMode === mode ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
              )}
              aria-current={displayMode === mode ? 'page' : undefined}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
      <div className="pt-10 sm:pt-6">
        <Pixels />
      </div>
    </>
  );
};

export default Dashboard;
