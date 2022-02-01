import React from 'react';
import ReactDOM from 'react-dom';
import { Router, LocationProvider } from '@reach/router';
import { Provider } from 'react-redux';

import Layout from './components/Layout';
import { store } from './store';
import App from './App';
import NotFound from './NotFound';

import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <LocationProvider>
        <Layout>
          <Router>
            <App path="/" />
            <NotFound default />
          </Router>
        </Layout>
      </LocationProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);
