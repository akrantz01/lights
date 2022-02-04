import React, { useEffect, useState } from 'react';
import flatpickr from 'flatpickr';

interface Props {
  label: string;
  description?: string;
  onChange: (v: string) => void;
}

const TimeInput = ({ label, description, onChange }: Props): JSX.Element => {
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  useEffect(() => {
    if (input === null) return;
    const fp = flatpickr(input as HTMLInputElement, {
      enableTime: true,
      noCalendar: true,
      altInput: true,
      altFormat: 'h:i K',
      dateFormat: 'H:i',
      ariaDateFormat: 'h:i K',
      static: true,
      onChange: (selected, time) => onChange(time),
    });
    return () => fp.destroy();
  }, [input]);

  return (
    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
      <label htmlFor={`timepicker-${label}`} className="block text-sm font-medium text-gray-700 sm:mt-px pt-2">
        {label}
      </label>
      <div className="mt-1 sm:mt-0 sm:col-span-2">
        <input
          type="text"
          name={`timepicker-${label}`}
          id={`timepicker-${label}`}
          className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
          ref={(r) => setInput(r)}
        />
        {description && <p className="text-sm text-gray-500 mt-3">{description}</p>}
      </div>
    </div>
  );
};

export default TimeInput;
