import React, { useEffect, useState } from 'react';

import Card from '../components/Card';
import DescriptionList from '../components/DescriptionList';
import { Scope, hasPermission, useSelector } from '../store';
import { Type } from '../store/display';
import Animation from './Animation';
import BrightnessSlider from './BrightnessSlider';
import Fill from './Fill';
import OnOffToggle from './OnOffToggle';
import Pixels from './Pixels';
import Tabs from './Tabs';

const Dashboard = () => {
  const displayMode = useSelector((state) => state.display.type);
  const [editMode, setEditMode] = useState(displayMode);

  const editable = useSelector(hasPermission(Scope.CONTROL_LIGHTS));

  useEffect(() => setEditMode(displayMode), [displayMode]);

  return (
    <>
      <Card>
        <DescriptionList name="Controls" description="The basic controls for the lights">
          <OnOffToggle className="py-6" disabled={!editable} />
          <BrightnessSlider className="py-6" disabled={!editable} />
        </DescriptionList>
      </Card>
      <Tabs
        selected={editMode}
        onChange={setEditMode}
        className="max-w-7xl mx-auto pb-2 px-4 sm:px-6 lg:px-8"
        disabled={!editable}
      />
      <Card>
        {editMode === Type.Fill && <Fill disabled={!editable} />}
        {editMode === Type.Pixels && <Pixels disabled={!editable} />}
        {editMode === Type.Animation && <Animation disabled={!editable} />}
      </Card>
    </>
  );
};

export default Dashboard;
