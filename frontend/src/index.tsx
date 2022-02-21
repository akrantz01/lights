import { LocationProvider, Router } from '@reach/router';
import React from 'react';
import ReactDOM from 'react-dom';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';

import { Animations } from './animations';
import NewAnimation from './animations/NewAnimation';
import Layout from './components/Layout';
import Dashboard from './dashboard';
import NotFound from './NotFound';
import { NewPreset, PresetDetail, Presets } from './presets';
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
        <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
        <Layout>
          <Router>
            <Dashboard path="/" />

            <Animations path="/animations" />
            <NewAnimation path="/new/animation" />

            <Presets path="/presets" />
            <PresetDetail path="/presets/:name" />
            <NewPreset path="/new/preset" />

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
