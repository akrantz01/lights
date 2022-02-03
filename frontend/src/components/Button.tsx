import React from 'react';
import classNames from 'classnames';

interface Props {
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  secondary?: boolean;
  rounded?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const Button = ({
  className,
  onClick,
  size = 'md',
  secondary = false,
  rounded = false,
  disabled = false,
  children,
}: Props): JSX.Element => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        className,
        {
          'px-2.5 py-1.5 text-xs': size === 'xs',
          'px-3 py-2 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-4 py-2 text-base': size === 'lg',
          'px-6 py-3 text-base': size === 'xl',
        },
        rounded ? 'rounded-full' : 'rounded-md',
        secondary
          ? 'text-indigo-700 bg-indigo-100 disabled:bg-indigo-200 hover:bg-indigo-200'
          : 'text-white bg-indigo-600 disabled:bg-indigo-600 hover:bg-indigo-700',
        'inline-flex items-center border border-transparent font-medium shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75',
      )}
    >
      {children}
    </button>
  );
};
export default Button;
