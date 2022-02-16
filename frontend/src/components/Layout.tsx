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

        <main className="-mt-32">{children}</main>
      </div>
    </>
  );
};

export default Layout;
