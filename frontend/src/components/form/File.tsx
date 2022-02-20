import React, { ChangeEvent, useRef } from 'react';

interface BaseProps {
  name?: string;
  id?: string;
  onChange: (f: File) => void;
  accept?: string;
}

const BaseFileInput = ({ name, id, accept, onChange }: BaseProps): JSX.Element => {
  const ref = useRef<HTMLInputElement | null>(null);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files !== null && files.length !== 0) onChange(files[0]);
  };

  return (
    <input
      ref={ref}
      type="file"
      className="max-w-lg p-1.5 bg-white block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
      id={id}
      name={name}
      accept={accept}
      onChange={onFileChange}
    />
  );
};

interface Props extends BaseProps {
  label: string;
  description?: string;
}

const FileInput = ({ label, description, onChange, accept }: Props) => (
  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-300 sm:pt-5">
    <label htmlFor={`file-${label}`} className="block text-sm font-medium text-gray-700 sm:mt-px pt-2">
      {label}
    </label>
    <div className="mt-1 sm:mt-0 sm:col-span-2">
      <BaseFileInput onChange={onChange} accept={accept} name={`file-${label}`} id={`file-${label}`} />
      {description && <p className="text-sm text-gray-500 mt-3">{description}</p>}
    </div>
  </div>
);

export { BaseFileInput, FileInput };
