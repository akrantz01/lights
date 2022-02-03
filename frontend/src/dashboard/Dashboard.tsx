import React from 'react';
import { RouteComponentProps } from '@reach/router';

import BrightnessSlider from './BrightnessSlider';
import OnOffToggle from './OnOffToggle';

const Dashboard: React.FC<RouteComponentProps> = () => {
  return (
    <>
      <div className="space-y-8 divide-y">
        <OnOffToggle />
        <BrightnessSlider className="border-t border-gray-400 pt-6" />
      </div>
    </>
  );
};

export default Dashboard;
