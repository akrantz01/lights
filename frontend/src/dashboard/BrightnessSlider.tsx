import React from 'react';
import classNames from 'classnames';

import { Slider } from '../components/form';
import { setBrightness, useDispatch, useSelector } from '../store';

interface Props {
  className?: string;
}

const BrightnessSlider = (props: Props): JSX.Element => {
  const dispatch = useDispatch();
  const brightness = useSelector((state) => state.strip.brightness);

  return (
    <div className={classNames('flex items-center justify-between', props.className)}>
      <label className="text-xl text-gray-800" htmlFor="dashboard-brightness-slider">
        Brightness
      </label>
      <div className="w-3/6 relative">
        <Slider value={brightness} onChange={(b) => dispatch(setBrightness(b))} id="dashboard-brightness-slider" />
      </div>
    </div>
  );
};
export default BrightnessSlider;
