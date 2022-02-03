import React from 'react';
import ReactDOM from 'react-dom';
import { Router, LocationProvider } from '@reach/router';
import { Provider } from 'react-redux';

import Layout from './components/Layout';
import Dashboard from './dashboard';
import NotFound from './NotFound';
import { connect, store } from './store';

import './index.css';
import Presets from './presets';

// Connect to the websocket API
store.dispatch(connect());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <LocationProvider>
        <Layout>
          <Router>
            <Dashboard path="/" />
            <Presets path="/presets" />
            <NotFound default />
          </Router>
        </Layout>
      </LocationProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);
