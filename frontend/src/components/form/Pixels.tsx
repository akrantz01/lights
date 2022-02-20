import { CheckIcon } from '@heroicons/react/outline';
import classNames from 'classnames';
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
  selected: Record<number, null>;
  setSelected: (s: Record<number, null>) => void;
}

const Display = ({ values, editable = true, selected, setSelected }: DisplayProps) => {
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

  return (
    <div
      className="pt-5 grid grid-cols-5 md:grid-cols-10 grid-flow-row gap-4 flex justify-items-center"
      onClick={() => setSelected({})}
    >
      {values.map((c, i) => (
        <button
          key={hash(c, i)}
          type="button"
          className="w-8 h-8 block rounded-md flex justify-center items-center"
          style={{ backgroundColor: `rgba(${c.r}, ${c.g}, ${c.b}, ${selected[i] === null ? 0.5 : 1})` }}
          onClick={onClick(i)}
          disabled={!editable}
        >
          {selected[i] === null && <CheckIcon className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );
};

interface LabelProps extends Editable {
  light?: boolean;
}

const Label = ({ editable = true, light = false }: LabelProps): JSX.Element => (
  <div>
    <label
      htmlFor="pixels"
      className={classNames('block text-sm font-medium sm:mt-px pt-2', light ? 'text-gray-500' : 'text-gray-700')}
    >
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

interface PixelsProps extends Editable {
  values: Color[];
  onChange?: (v: Color[]) => void;
}

const Pixels = ({ values, onChange = noop, editable = true }: PixelsProps): JSX.Element => {
  const [color, setColor] = useState<Color>({ r: 0, g: 0, b: 0 });
  const [selected, setSelected] = useState<Record<number, null>>({}); // Create a makeshift immutable set

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
      <Display values={values} selected={selected} setSelected={setSelected} editable={editable} />
    </div>
  );
};

interface UpdatablePixelsProps {
  values: Color[];
  onSave: (v: Color[]) => void;
}

const UpdatablePixels = ({ values: initialValues, onSave }: UpdatablePixelsProps): JSX.Element => {
  const [isUpdating, setUpdating] = useState(false);
  const [values, setValues] = useState(initialValues);

  const [color, setColor] = useState<Color>({ r: 0, g: 0, b: 0 });
  const [selected, setSelected] = useState<Record<number, null>>({}); // Makeshift immutable set

  // Handle toggling the update state and saving
  const onToggleUpdate = () => {
    if (isUpdating) {
      onSave(values);
      setSelected({});
    }
    setUpdating(!isUpdating);
  };

  // Handle cancelling the update
  const onCancel = () => {
    setValues(initialValues);
    setSelected({});
    setUpdating(false);
  };

  // Update the selected pixels
  const onColorChange = (c: Color) => {
    setColor(c);

    const updated = [...values];
    for (const index of Object.keys(selected)) updated[parseInt(index)] = c;
    setValues(updated);
  };

  return (
    <div className="pb-5">
      <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-300 sm:pt-5">
        <Label editable={isUpdating} light={true} />
        <div className="flex sm:col-span-2">
          <span className="flex flex-grow justify-center">
            {isUpdating ? <BaseColorInput value={color} onChange={onColorChange} /> : '​'}
          </span>
          <span className="ml-4 flex-shrink-0">
            {isUpdating && (
              <>
                <button
                  type="button"
                  className="mr-3 bg-gray-200 text-sm rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <span className="text-gray-500 font-bold mr-3" aria-hidden="true">
                  |
                </span>
              </>
            )}
            <button
              type="button"
              onClick={onToggleUpdate}
              className="bg-gray-200 rounded-md text-sm font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isUpdating ? 'Save' : 'Update'}
            </button>
          </span>
        </div>
      </div>
      <Display values={values} selected={selected} setSelected={setSelected} editable={isUpdating} />
    </div>
  );
};

export { Pixels, UpdatablePixels };
