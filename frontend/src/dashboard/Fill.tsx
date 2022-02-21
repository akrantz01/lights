import classNames from 'classnames';
import React from 'react';

import { BaseColorInput } from '../components/form';
import { setColor, useDispatch, useSelector } from '../store';

interface Props {
  disabled?: boolean;
}

const Fill = ({ disabled }: Props): JSX.Element => {
  const dispatch = useDispatch();
  const color = useSelector((state) =>
    state.display.pixels.length > 0 ? state.display.pixels[0] : { r: 0, g: 0, b: 0 },
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {!disabled && (
          <div className="flex justify-center mb-5 sm:mb-0">
            <BaseColorInput value={color} onChange={(c) => dispatch(setColor(c))} />
          </div>
        )}
        <span
          className={classNames(disabled ? 'col-span-2' : 'md:mt-16', 'w-auto h-16 block rounded transition-opacity')}
          style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
        />
      </div>
      <p className="text-sm font-medium text-gray-600 pt-4">
        {!disabled && 'Change the color of the strip using the color picker on the left.'} The bar displays the current
        color shown on the light strip. <br />
        <b>NOTE:</b> the actual color displayed may not be exactly what is shown on the monitor due to the imperfect
        LEDs.
      </p>
    </>
  );
};

export default Fill;
