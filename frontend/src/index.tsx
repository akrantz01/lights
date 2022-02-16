import { LocationProvider, Router } from '@reach/router';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { Animations } from './animations';
import Layout from './components/Layout';
import Dashboard from './dashboard';
import NotFound from './NotFound';
import { PresetDetail, Presets } from './presets';
import { NewSchedule, ScheduleDetail, Schedules } from './schedules';
import { connect, store } from './store';

import 'flatpickr/dist/flatpickr.min.css';
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
            <NewSchedule path="/new/schedule" />

            <NotFound default />
          </Router>
        </Layout>
      </LocationProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);
