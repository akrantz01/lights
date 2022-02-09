import React, { MouseEvent, useState } from 'react';
import { CheckIcon } from '@heroicons/react/outline';

import { BaseColorInput } from '../components/form';
import { setColor, setArbitraryPixels, useSelector, useDispatch } from '../store';
import { Color } from '../types';
import Button from '../components/Button';

const hash = (c: Color, i: number) => {
  let h = 23;
  h += h * 31 + c.r;
  h += h * 31 + c.g;
  h += h * 31 + c.b;
  return h ^ i;
};

const Pixels = (): JSX.Element => {
  const dispatch = useDispatch();
  const pixels = useSelector((state) => state.display.pixels || []);

  const [pixelColor, setPixelColor] = useState<Color>({ r: 0, g: 0, b: 0 });
  const [selected, setSelected] = useState<Record<number, null>>({}); // Create a makeshift immutable set
  const [lastSelected, setLastSelected] = useState(0);

  // Handle selecting/deselecting pixels
  const onClick = (index: number) => (e: MouseEvent<HTMLButtonElement>) => {
    let newSelected = { ...selected };

    // Add/remove any elements in the range
    if (e.shiftKey && e.ctrlKey) {
      for (let i = Math.min(index, lastSelected); i < Math.max(index, lastSelected); i++) {
        if (i in selected) delete newSelected[i];
        else newSelected[i] = null;
      }
    }

    // Add/remove an element to the selection
    else if (e.ctrlKey) {
      if (index in selected) delete newSelected[index];
      else newSelected[index] = null;
    }

    // Set a range of elements as the selection
    else if (e.shiftKey) {
      newSelected = {};
      for (let i = Math.min(index, lastSelected); i <= Math.max(index, lastSelected); i++) {
        newSelected[i] = null;
      }
    }

    // Toggle the element otherwise
    else {
      if (Object.keys(newSelected).length === 1 && newSelected[index] === null) delete newSelected[index];
      else newSelected = { [index]: null };
    }

    setLastSelected(index);
    setSelected(newSelected);
  };

  return (
    <>
      <div className="grid md:grid-cols-3 flex justify-items-center items-center">
        <BaseColorInput value={pixelColor} onChange={setPixelColor} />
        <div className="md:grid md:grid-cols-2 flex justify-items-center items-center mt-5 md:mt-0 md:col-span-2">
          <Button
            onClick={() =>
              dispatch(
                setArbitraryPixels({ color: pixelColor, indexes: Object.keys(selected).map((i) => parseInt(i)) }),
              )
            }
          >
            Set Selected Pixels
          </Button>
          <Button className="ml-3" onClick={() => dispatch(setColor(pixelColor))}>
            Fill
          </Button>
        </div>
      </div>
      <div className="pt-5 grid grid-cols-5 md:grid-cols-10 grid-flow-row gap-4 flex justify-items-center">
        {pixels.map((c, i) => (
          <button
            key={hash(c, i)}
            className="w-8 h-8 block rounded-md flex justify-center items-center"
            style={{ backgroundColor: `rgba(${c.r}, ${c.g}, ${c.b}, ${selected[i] === null ? 0.5 : 1})` }}
            onClick={onClick(i)}
          >
            {selected[i] === null && <CheckIcon className="w-5 h-5" />}
          </button>
        ))}
      </div>
    </>
  );
};

export default Pixels;
