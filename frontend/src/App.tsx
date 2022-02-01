import React from 'react';
import { RouteComponentProps } from '@reach/router';

import logo from './logo.svg';

const App: React.FC<RouteComponentProps> = () => {
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center text-gray-700">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none motion-safe:animate-[spin_infinite_20s_linear]"
          alt="logo"
        />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a className="text-sky-400" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>
    </div>
  );
};

export default App;
