import React, { useState } from 'react';

import { BaseColorInput } from '../components/form';
import { Display } from '../components/form/Pixels';
import { setArbitraryPixels, useDispatch, useSelector } from '../store';
import { Color } from '../types';

const Pixels = (): JSX.Element => {
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
      <div className="flex justify-center">
        <BaseColorInput value={pixelColor} onChange={onChange} />
      </div>
      <Display values={pixels} selected={selected} setSelected={setSelected} />
    </>
  );
};

export default Pixels;