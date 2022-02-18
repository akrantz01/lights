import { RouteComponentProps } from '@reach/router';
import React, { useEffect, useState } from 'react';

import Card from '../components/Card';
import DescriptionList from '../components/DescriptionList';
import { useSelector } from '../store';
import { Type } from '../store/display';
import BrightnessSlider from './BrightnessSlider';
import Fill from './Fill';
import OnOffToggle from './OnOffToggle';
import Pixels from './Pixels';
import Tabs from './Tabs';

const Dashboard: React.FC<RouteComponentProps> = () => {
  const displayMode = useSelector((state) => state.display.type);
  const [editMode, setEditMode] = useState(displayMode);

  useEffect(() => setEditMode(displayMode), [displayMode]);

  return (
    <>
      <Card>
        <DescriptionList name="Controls" description="The basic controls for the lights">
          <OnOffToggle className="py-6" />
          <BrightnessSlider className="py-6" />
        </DescriptionList>
      </Card>
      <Tabs selected={editMode} onChange={setEditMode} className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8" />
      <Card>
        <div className="pt-10 sm:pt-6">
          {editMode === Type.Fill && <Fill />}
          {editMode === Type.Pixels && <Pixels />}
        </div>
      </Card>
    </>
  );
};

export default Dashboard;
