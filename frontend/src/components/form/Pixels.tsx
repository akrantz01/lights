import { CheckIcon } from '@heroicons/react/outline';
import React, { MouseEvent, useState } from 'react';

import { Color } from '../../types';
import { BaseColorInput } from './ColorInput';

const hash = (c: Color, i: number) => {
  let h = 23;
  h += h * 31 + c.r;
  h += h * 31 + c.g;
  h += h * 31 + c.b;
  return h ^ i;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

interface Editable {
  editable?: boolean;
}

interface DisplayProps extends Editable {
  values: Color[];
  onClick?: (i: number) => (e: MouseEvent<HTMLButtonElement>) => void;
  onReset?: () => void;
  isSelected?: (i: number) => boolean;
}

const Display = ({
  values,
  editable = true,
  onClick = () => noop,
  onReset = noop,
  isSelected = () => false,
}: DisplayProps) => (
  <div
    className="pt-5 grid grid-cols-5 md:grid-cols-10 grid-flow-row gap-4 flex justify-items-center"
    onClick={onReset}
  >
    {values.map((c, i) => (
      <button
        key={hash(c, i)}
        type="button"
        className="w-8 h-8 block rounded-md flex justify-center items-center"
        style={{ backgroundColor: `rgba(${c.r}, ${c.g}, ${c.b}, ${isSelected(i) ? 0.5 : 1})` }}
        onClick={onClick(i)}
        disabled={!editable}
      >
        {isSelected(i) && <CheckIcon className="w-5 h-5" />}
      </button>
    ))}
  </div>
);

const Label = ({ editable = true }: Editable): JSX.Element => (
  <div>
    <label htmlFor="pixels" className="block text-sm font-medium text-gray-700 sm:mt-px pt-2">
      Pixels
    </label>
    {editable && (
      <p className="text-sm text-gray-500">
        Click on a pixel to select it and change its color. To select multiple non-consecutive pixels, control + left
        click. To select multiple consecutive pixels, shift + left click. The strip is laid out horizontally where the
        neighboring pixels are on the left and right.
      </p>
    )}
  </div>
);

interface Props extends Editable {
  values: Color[];
  onChange?: (v: Color[]) => void;
}

const Pixels = ({ values, onChange = noop, editable = true }: Props): JSX.Element => {
  const [color, setColor] = useState<Color>({ r: 0, g: 0, b: 0 });
  const [selected, setSelected] = useState<Record<number, null>>({}); // Create a makeshift immutable set
  const [lastSelected, setLastSelected] = useState(0);

  // Handle selecting/deselecting pixels
  const onClick = (index: number) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

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

  // Update the selected pixels
  const onColorChange = (c: Color) => {
    setColor(c);

    const updated = [...values];
    for (const index of Object.keys(selected)) updated[parseInt(index)] = c;
    onChange(updated);
  };

  return (
    <div>
      <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-300 sm:pt-5">
        <Label editable={editable} />
        <div className="flex sm:col-span-2 justify-center">
          {editable && <BaseColorInput value={color} onChange={onColorChange} />}
        </div>
      </div>
      <Display
        values={values}
        onReset={() => setSelected({})}
        onClick={onClick}
        isSelected={(i) => selected[i] === null}
      />
    </div>
  );
};

export default Pixels;
