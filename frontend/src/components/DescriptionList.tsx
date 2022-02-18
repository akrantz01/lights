import { PencilAltIcon, SaveIcon, XIcon } from '@heroicons/react/outline';
import React, { ComponentType, ReactNode, useState } from 'react';

import { Color } from '../types';
import { BaseBitwiseCheckbox, BaseColorInput, BaseDropdown, BaseInput, BaseTimeInput, Slider, Toggle } from './form';

interface UpdateInputProps<T> {
  value: T;
  onChange: (value: T) => void;
}

const BitwiseCheckboxInput =
  (options: Record<string, number>) =>
  // eslint-disable-next-line react/display-name
  ({ value, onChange }: UpdateInputProps<number>) =>
    <BaseBitwiseCheckbox options={options} value={value} onChange={onChange} />;

const BooleanInput = ({ value, onChange }: UpdateInputProps<boolean>): JSX.Element => (
  <Toggle enabled={value} onChange={() => onChange(!value)} />
);

const ColorInput = ({ value, onChange }: UpdateInputProps<Color>): JSX.Element => (
  <BaseColorInput value={value} onChange={onChange} />
);

const DropdownInput =
  (options: Record<string, string | number>) =>
  // eslint-disable-next-line react/display-name
  ({ value, onChange }: UpdateInputProps<string>) =>
    <BaseDropdown options={options} value={value} onChange={onChange} />;

const SliderInput = ({ value, onChange }: UpdateInputProps<number>): JSX.Element => (
  <Slider value={value} onChange={onChange} />
);

const StringInput = ({ value, onChange }: UpdateInputProps<string>): JSX.Element => (
  <BaseInput value={value} onChange={onChange} />
);

const TimeInput = ({ value, onChange }: UpdateInputProps<string>): JSX.Element => (
  <BaseTimeInput onChange={onChange} value={value} />
);

interface FieldProps<T> {
  name: string;
  value: T;
  input: ComponentType<UpdateInputProps<T>>;
  onSave: (value: T) => void;
  displayFn?: (value: T) => string;
  component?: ComponentType<{ value: T }>;
}

const Field = <T,>({
  component: DisplayComponent,
  displayFn = String,
  input: InputComponent,
  name,
  onSave,
  value: initialValue,
}: FieldProps<T>): JSX.Element => {
  const [isUpdating, setUpdating] = useState(false);
  const [value, setValue] = useState(initialValue);

  // Handle toggling the updating state and saving
  const onToggleUpdate = () => {
    if (isUpdating) onSave(value);
    setUpdating(!isUpdating);
  };

  // Handle cancelling the update
  const onCancel = () => {
    setValue(initialValue);
    setUpdating(false);
  };

  return (
    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{name}</dt>
      <dd className="mt-1 flex text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        <span className="flex-grow">
          {isUpdating && InputComponent !== undefined && <InputComponent value={value} onChange={setValue} />}
          {!isUpdating && DisplayComponent !== undefined && <DisplayComponent value={value} />}
          {!isUpdating && DisplayComponent === undefined && displayFn(value)}
        </span>
        <span className="ml-4 flex-shrink-0">
          {isUpdating && (
            <>
              <button
                type="button"
                className="mr-3 bg-gray-200 rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
            className="bg-gray-200 rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={onToggleUpdate}
          >
            {isUpdating && 'Save'}
            {!isUpdating && 'Update'}
          </button>
        </span>
      </dd>
    </div>
  );
};

interface ListProps {
  name: string;
  description?: string;
  onSave?: (v: string) => void;
  rightContent?: ReactNode;
  children: ReactNode;
}

const DescriptionList = ({
  name: initialName,
  description,
  onSave,
  rightContent,
  children,
}: ListProps): JSX.Element => {
  const [isUpdating, setUpdating] = useState(false);
  const [name, setName] = useState(initialName);

  const toggleUpdating = () => {
    if (onSave === undefined) return;

    if (isUpdating) onSave(name);
    setUpdating(!isUpdating);
  };

  return (
    <>
      <div className="flex">
        <div className="flex-grow">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex">
            {!isUpdating && name}
            {isUpdating && (
              <>
                <BaseInput value={name} onChange={setName} />
                <button
                  type="button"
                  className="mx-1 text-sm text-gray-400 hover:text-gray-600"
                  onClick={() => setUpdating(false)}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </>
            )}

            {onSave !== undefined && (
              <button
                type="button"
                className="ml-1 text-sm text-indigo-400 hover:text-indigo-600"
                onClick={toggleUpdating}
              >
                {isUpdating && <SaveIcon className="w-4 h-4" />}
                {!isUpdating && <PencilAltIcon className="w-4 h-4" />}
              </button>
            )}
          </h3>
          {description && <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>}
        </div>
        <div className="flex-shrink-0">{rightContent}</div>
      </div>
      <div className="mt-5 border-t border-b border-gray-300">
        <dl className="sm:divide-y sm:divide-gray-300">{children}</dl>
      </div>
    </>
  );
};

// Register under namespace
DescriptionList.Field = Field;
DescriptionList.BitwiseCheckboxInput = BitwiseCheckboxInput;
DescriptionList.BooleanInput = BooleanInput;
DescriptionList.ColorInput = ColorInput;
DescriptionList.DropdownInput = DropdownInput;
DescriptionList.SliderInput = SliderInput;
DescriptionList.StringInput = StringInput;
DescriptionList.TimeInput = TimeInput;

export default DescriptionList;
