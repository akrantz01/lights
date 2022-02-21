import { Auth0Provider } from '@auth0/auth0-react';
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

const AUTH0_DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN || '';
const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID || '';

// Connect to the websocket API
store.dispatch(connect());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Auth0Provider domain={AUTH0_DOMAIN} clientId={AUTH0_CLIENT_ID} redirectUri={window.location.origin}>
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
      </Auth0Provider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);
