import React, { ReactNode } from 'react';

import Navigation from './Navigation';

interface Props {
  children: ReactNode;
}

const Layout = ({ children }: Props): JSX.Element => {
  return (
    <>
      <div className="min-h-full">
        <Navigation />

        <main className="-mt-32">
          <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">{children}</div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Layout;
