import React from 'react';

import { BaseProps } from './props';

const Slider = ({ value, onChange, ...props }: BaseProps<number>) => {
  return (
    <div className="relative">
      <input
        className="w-full"
        id={props.id}
        name={props.name}
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(parseInt((event.target as HTMLInputElement).value))}
      />
      <span
        className="text-sm mt-6 px-1 py-0.5 absolute rounded translate-x-2/4 bg-indigo-300"
        style={{ left: `calc(${value}% - ${20 + value * 0.3}px)` }}
      >
        {value}%
      </span>
    </div>
  );
};

export default Slider;
