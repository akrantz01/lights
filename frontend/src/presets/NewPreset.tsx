import { RefreshIcon } from '@heroicons/react/outline';
import { Link, RouteComponentProps, useNavigate } from '@reach/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import Button from '../components/Button';
import Card from '../components/Card';
import { Input, Pixels, Slider } from '../components/form';
import { Scope, hasPermission, useCreatePresetMutation, useSelector } from '../store';
import { Color } from '../types';

const NewPreset: React.FC<RouteComponentProps> = () => {
  const navigate = useNavigate();
  const length = useSelector((state) => state.strip.length);
  const [createPreset, { isLoading, isUninitialized, isError }] = useCreatePresetMutation();

  const canCreate = useSelector(hasPermission(Scope.EDIT_PRESETS));

  // Track form state
  const [name, setName] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [pixels, setPixels] = useState<Color[]>(Array(length).fill({ r: 0, g: 0, b: 0 }));

  // Automatically navigate away once complete
  useEffect(() => {
    if (!isUninitialized && !isLoading && !isError) {
      toast.success(`Created preset '${name}'`);
      navigate('/presets').catch(console.error);
    }
  }, [isLoading]);

  return (
    <Card>
      <form className="space-y-8 divide-y divide-gray-300">
        <div className="space-y-8 divide-y divide-gray-300 sm:space-y-5">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Preset</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about the preset</p>
          </div>
          <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
            <Input label="Name" value={name} onChange={setName} />
            <Slider label="Brightness" value={brightness} onChange={setBrightness} />
            <Pixels values={pixels} onChange={setPixels} />
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <Link
              to="/presets"
              className="px-4 py-2 text-sm rounded-md text-indigo-700 bg-indigo-100 disabled:bg-indigo-200 hover:bg-indigo-200 inline-flex items-center border border-transparent font-medium shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
            >
              Cancel
            </Link>
            <Button
              style="primary"
              className="ml-2"
              disabled={!canCreate || isLoading}
              onClick={() => createPreset({ name, brightness, pixels })}
            >
              {!isLoading && 'Create'}
              {isLoading && <RefreshIcon className="w-5 h-5 animate-spin" />}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default NewPreset;
