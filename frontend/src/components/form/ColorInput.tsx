import React from 'react';
import { ChromePicker, RGBColor } from 'react-color';

import { BaseProps } from './props';

const BaseColorInput = ({ value, onChange }: BaseProps<RGBColor>): JSX.Element => (
  // Types currently broken: https://github.com/casesandberg/react-color/issues/855
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  <ChromePicker disableAlpha color={value} onChange={(color) => onChange(color.rgb)} />
);

interface Props extends BaseProps<RGBColor> {
  label: string;
  description?: string;
}

const ColorInput = ({ label, description, value, onChange }: Props): JSX.Element => {
  return (
    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-300 sm:pt-5">
      <label className="block text-sm font-medium text-gray-700 sm:mt-px pt-2">{label}</label>
      <div className="mt-1 sm:mt-0 sm:col-span-2">
        <BaseColorInput value={value} onChange={onChange} />
        {description && <p className="text-sm text-gray-500 mt-3">{description}</p>}
      </div>
    </div>
  );
};

export { BaseColorInput, ColorInput };
