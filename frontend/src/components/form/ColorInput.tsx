import React from 'react';
import { ChromePicker, RGBColor } from 'react-color';

interface Props {
  label: string;
  description?: string;
  value: RGBColor;
  onChange: (v: RGBColor) => void;
}

const ColorInput = ({ label, description, value, onChange }: Props): JSX.Element => {
  return (
    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
      <label className="block text-sm font-medium text-gray-700 sm:mt-px pt-2">{label}</label>
      <div className="mt-1 sm:mt-0 sm:col-span-2">
        <ChromePicker disableAlpha color={value} onChange={(color) => onChange(color.rgb)} />
        {description && <p className="text-sm text-gray-500 mt-3">{description}</p>}
      </div>
    </div>
  );
};

export default ColorInput;
