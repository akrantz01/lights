import React, { useState } from 'react';

import { BaseColorInput } from '../components/form';
import { Description, Display } from '../components/form/Pixels';
import { setArbitraryPixels, useDispatch, useSelector } from '../store';
import { Color } from '../types';

interface Props {
  disabled?: boolean;
}

const Pixels = ({ disabled }: Props): JSX.Element => {
  const dispatch = useDispatch();
  const pixels = useSelector((state) => state.display.pixels || []);

  const [pixelColor, setPixelColor] = useState<Color>({ r: 0, g: 0, b: 0 });
  const [selected, setSelected] = useState<Record<number, null>>({}); // Create a makeshift immutable set

  const onChange = (c: Color) => {
    setPixelColor(c);
    dispatch(setArbitraryPixels({ color: c, indexes: Object.keys(selected).map((i) => parseInt(i)) }));
  };

  return (
    <>
      {disabled ? (
        <p className="text-sm font-medium text-gray-500">
          The strip is laid out horizontally where the neighboring pixels are on the left and right.
        </p>
      ) : (
        <div className="sm:grid sm:grid-cols-2">
          <div className="flex justify-center">
            <BaseColorInput value={pixelColor} onChange={onChange} />
          </div>
          <Description />
        </div>
      )}
      <Display values={pixels} selected={selected} setSelected={setSelected} disabled={disabled} />
    </>
  );
};

export default Pixels;
