import React, { Fragment, MouseEvent, useState } from 'react';
import { CheckIcon } from '@heroicons/react/outline';

import { useSelector } from '../store';
import { Color } from '../types';

const hash = (c: Color, i: number) => {
  let h = 23;
  h += h * 31 + c.r;
  h += h * 31 + c.g;
  h += h * 31 + c.b;
  return h ^ i;
};

const Pixels = (): JSX.Element => {
  const [selected, setSelected] = useState<Record<number, null>>({});
  const [lastSelected, setLastSelected] = useState(0);

  const pixels = useSelector((state) => state.display.pixels || []);

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
      if (Object.keys(newSelected).length === 0) newSelected[index] = null;
      else newSelected = { [index]: null };
    }

    setLastSelected(index);
    setSelected(newSelected);
  };

  return (
    <>
      <div className="grid grid-rows-60 md:grid-rows-30 grid-flow-col gap-4">
        {pixels.map((c, i) => (
          <button
            key={hash(c, i)}
            className="w-16 h-16 block rounded-md flex justify-center items-center"
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
