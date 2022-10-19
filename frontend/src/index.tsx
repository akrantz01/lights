import { LocationProvider, Router } from '@reach/router';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';

import AuthHandler from './components/AuthHandler';
import Layout from './components/Layout';
import SuspenseLoading from './components/SuspenseLoading';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { connect, store } from './store';

import 'flatpickr/dist/flatpickr.min.css';
import './index.css';

const Animations = React.lazy(() => import('./animations/Animations'));
const NewAnimation = React.lazy(() => import('./animations/NewAnimation'));
const Dashboard = React.lazy(() => import('./dashboard/Dashboard'));
const NotFound = React.lazy(() => import('./NotFound'));
const OpenIDConnectCallback = React.lazy(() => import('./OpenIDConnectCallback'));
const NewPreset = React.lazy(() => import('./presets/NewPreset'));
const PresetDetail = React.lazy(() => import('./presets/PresetDetail'));
const Presets = React.lazy(() => import('./presets/Presets'));
const NewSchedule = React.lazy(() => import('./schedules/NewSchedule'));
const ScheduleDetail = React.lazy(() => import('./schedules/ScheduleDetail'));
const Schedules = React.lazy(() => import('./schedules/Schedules'));

// Connect to the websocket API
store.dispatch(connect());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthHandler />
      <LocationProvider>
        <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
        <Layout>
          <Suspense fallback={<SuspenseLoading />}>
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

              <OpenIDConnectCallback path="/oauth/callback" />

              <NotFound default />
            </Router>
          </Suspense>
        </Layout>
      </LocationProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
