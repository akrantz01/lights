import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/Button';
import Card from '../components/Card';
import { FileInput, Input } from '../components/form';
import { Scope, hasPermission, useCreateAnimationMutation, useSelector } from '../store';

const NewAnimation = (): JSX.Element => {
  const navigate = useNavigate();
  const [createAnimation, { isLoading, isUninitialized, isError }] = useCreateAnimationMutation();

  const canCreate = useSelector(hasPermission(Scope.EDIT));

  // Track form state
  const [name, setName] = useState('');
  const [file, setFile] = useState<File>();

  // Automatically navigate away once complete
  useEffect(() => {
    if (!isUninitialized && !isLoading && !isError) {
      toast.success(`Created animation '${name}'`);
      navigate('/animations');
    }
  }, [isLoading]);

  return (
    <Card>
      <form className="space-y-8 divide-y divide-gray-300">
        <div className="space-y-8 divide-y divide-gray-300 sm:space-y-5">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Animation</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about the animation</p>
          </div>
          <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
            <Input label="Name" value={name} onChange={setName} />
            <FileInput label="WASM" onChange={setFile} />
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <Link
              to="/animations"
              className="px-4 py-2 text-sm rounded-md text-indigo-700 bg-indigo-100 disabled:bg-indigo-200 hover:bg-indigo-200 inline-flex items-center border border-transparent font-medium shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
            >
              Cancel
            </Link>
            <Button
              style="primary"
              className="ml-2"
              disabled={!canCreate || isLoading}
              onClick={() => createAnimation({ name, wasm: file as File })}
            >
              {!isLoading && 'Create'}
              {isLoading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default NewAnimation;
