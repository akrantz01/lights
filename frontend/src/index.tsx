import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

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

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthHandler />
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
        <Layout>
          <Suspense fallback={<SuspenseLoading />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />

              <Route path="/animations" element={<Animations />} />
              <Route path="/new/animation" element={<NewAnimation />} />

              <Route path="/presets" element={<Presets />} />
              <Route path="/presets/:name" element={<PresetDetail />} />
              <Route path="/new/preset" element={<NewPreset />} />

              <Route path="/schedules" element={<Schedules />} />
              <Route path="/schedules/:name" element={<ScheduleDetail />} />
              <Route path="/new/schedule" element={<NewSchedule />} />

              <Route path="/oauth/callback" element={<OpenIDConnectCallback />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
