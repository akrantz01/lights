import React from 'react';
import ReactDOM from 'react-dom';
import { Router, LocationProvider } from '@reach/router';

import Layout from './components/Layout';
import App from './App';
import NotFound from './NotFound';

import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <LocationProvider>
      <Layout>
        <Router>
          <App path="/" />
          <NotFound default />
        </Router>
      </Layout>
    </LocationProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
