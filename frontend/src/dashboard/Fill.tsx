import React from 'react';

import { BaseColorInput } from '../components/form';
import { setColor, useDispatch, useSelector } from '../store';

const Fill = (): JSX.Element => {
  const dispatch = useDispatch();
  const color = useSelector((state) =>
    state.display.pixels.length > 0 ? state.display.pixels[0] : { r: 0, g: 0, b: 0 },
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex justify-center mb-5 sm:mb-0">
        <BaseColorInput value={color} onChange={(c) => dispatch(setColor(c))} />
      </div>
      <span
        className="w-auto h-16 block rounded transition-opacity md:mt-16"
        style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
      />
    </div>
  );
};

export default Fill;
