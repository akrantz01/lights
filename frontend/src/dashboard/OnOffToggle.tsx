import React from 'react';
import { Switch } from '@headlessui/react';

import { Toggle } from '../components/form';
import { turnOff, turnOn, useDispatch, useSelector } from '../store';

const OnOffToggle = (): JSX.Element => {
  const dispatch = useDispatch();
  const on = useSelector((state) => state.strip.on);

  const onChange = () => dispatch(on ? turnOff() : turnOn());

  return (
    <Switch.Group>
      <div className="flex items-center justify-between">
        <Switch.Label className="text-xl text-gray-800">Lights</Switch.Label>
        <Toggle enabled={on} onChange={onChange} large />
      </div>
    </Switch.Group>
  );
};
export default OnOffToggle;
