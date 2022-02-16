import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const Card = ({ children }: Props): JSX.Element => (
  <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
    <div className="bg-gray-200 rounded-lg shadow px-5 py-6 sm:px-6">{children}</div>
  </div>
);

export default Card;
