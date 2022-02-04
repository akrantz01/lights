import React from 'react';
import ReactDOM from 'react-dom';
import { Router, LocationProvider } from '@reach/router';
import { Provider } from 'react-redux';

import { Animations } from './animations';
import Layout from './components/Layout';
import Dashboard from './dashboard';
import NotFound from './NotFound';
import { Presets, PresetDetail } from './presets';
import { Schedules, ScheduleDetail } from './schedules';
import { connect, store } from './store';

import './index.css';

// Connect to the websocket API
store.dispatch(connect());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <LocationProvider>
        <Layout>
          <Router>
            <Dashboard path="/" />
            <Animations path="/animations" />
            <Presets path="/presets" />
            <PresetDetail path="/presets/:name" />
            <Schedules path="/schedules" />
            <ScheduleDetail path="/schedules/:name" />
            <NotFound default />
          </Router>
        </Layout>
      </LocationProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);
