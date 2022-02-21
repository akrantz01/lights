import { Switch } from '@headlessui/react';
import classNames from 'classnames';
import React from 'react';

import { Toggle } from '../components/form';
import { turnOff, turnOn, useDispatch, useSelector } from '../store';

interface Props {
  className?: string;
  disabled?: boolean;
}

const OnOffToggle = ({ className, disabled }: Props): JSX.Element => {
  const dispatch = useDispatch();
  const on = useSelector((state) => state.strip.on);

  const onChange = () => dispatch(on ? turnOff() : turnOn());

  return (
    <Switch.Group>
      <div className={classNames('flex items-center justify-between', className)}>
        <Switch.Label className="text-sm font-medium text-gray-600">Lights</Switch.Label>
        <Toggle enabled={on} onChange={onChange} large disabled={disabled} />
      </div>
    </Switch.Group>
  );
};
export default OnOffToggle;
