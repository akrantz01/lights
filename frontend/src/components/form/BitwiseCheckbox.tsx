import React, { ChangeEvent } from 'react';

interface Props {
  label: string;
  description?: string;
  options: Record<string, number>;
  value: number;
  onChange: (v: number) => void;
}

const BitwiseCheckbox = ({ label, description, options, value, onChange }: Props): JSX.Element => {
  const onCheckboxUpdate = (event: ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(event.target.value);
    onChange(value ^ index);
  };

  return (
    <div className="space-y-6 sm:space-y-5 divide-y divide-gray-200">
      <div className="pt-2 sm:pt-5">
        <div role="group" aria-labelledby="bwcb-label">
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-baseline">
            <div>
              <div className="font-medium text-gray-900 text-sm sm:text-gray-700" id="bwcb-label">
                {label}
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:col-span-2">
              <div className="max-w-lg space-y-4">
                {description && <p className="text-sm text-gray-500">{description}</p>}
                {Object.keys(options).map((name) => (
                  <div key={name} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={`bwcb-${name}-${options[name]}`}
                        name={`bwcb-${name}-${options[name]}`}
                        type="checkbox"
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        onChange={onCheckboxUpdate}
                        value={options[name]}
                        checked={(value & options[name]) === options[name]}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={`bwcb-${name}-${options[name]}`} className="font-medium text-gray-700">
                        {name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitwiseCheckbox;
