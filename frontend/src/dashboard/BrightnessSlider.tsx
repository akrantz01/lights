import React from 'react';
import classNames from 'classnames';

import { setBrightness, useDispatch, useSelector } from '../store';

interface Props {
  className?: string;
}

const BrightnessSlider = (props: Props): JSX.Element => {
  const dispatch = useDispatch();
  const brightness = useSelector((state) => state.strip.brightness);

  return (
    <div className={classNames('flex items-center justify-between', props.className)}>
      <label className="text-2xl" htmlFor="dashboard-brightness-slider">
        Brightness
      </label>
      <div className="w-3/6 relative">
        <input
          className="w-full"
          id="dashboard-brightness-slider"
          type="range"
          min="0"
          max="100"
          value={brightness}
          onChange={(event) => dispatch(setBrightness(parseInt((event.target as HTMLInputElement).value)))}
        />
        <span
          className="text-sm mt-6 px-1 py-0.5 absolute rounded translate-x-2/4 bg-indigo-300"
          style={{ left: `calc(${brightness}% - ${20 + brightness * 0.3}px)` }}
        >
          {brightness}%
        </span>
      </div>
    </div>
  );
};
export default BrightnessSlider;
