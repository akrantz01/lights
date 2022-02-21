import { Auth0Provider } from '@auth0/auth0-react';
import { LocationProvider, Router } from '@reach/router';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';

import AuthHandler from './components/AuthHandler';
import Layout from './components/Layout';
import SuspenseLoading from './components/SuspenseLoading';
import { Scope, connect, store } from './store';

import 'flatpickr/dist/flatpickr.min.css';
import './index.css';

const Animations = React.lazy(() => import('./animations/Animations'));
const NewAnimation = React.lazy(() => import('./animations/NewAnimation'));
const Dashboard = React.lazy(() => import('./dashboard/Dashboard'));
const NotFound = React.lazy(() => import('./NotFound'));
const NewPreset = React.lazy(() => import('./presets/NewPreset'));
const PresetDetail = React.lazy(() => import('./presets/PresetDetail'));
const Presets = React.lazy(() => import('./presets/Presets'));
const NewSchedule = React.lazy(() => import('./schedules/NewSchedule'));
const ScheduleDetail = React.lazy(() => import('./schedules/ScheduleDetail'));
const Schedules = React.lazy(() => import('./schedules/Schedules'));

const AUTH0_DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN || '';
const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID || '';

// Connect to the websocket API
store.dispatch(connect());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        redirectUri={window.location.origin}
        cacheLocation="localstorage"
        audience="https://lights.krantz.dev"
        scope={Object.values(Scope).join(' ')}
        useRefreshTokens
      >
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

                <NotFound default />
              </Router>
            </Suspense>
          </Layout>
        </LocationProvider>
      </Auth0Provider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);
