import React, { useState } from 'react';
import { RouteComponentProps, useNavigate } from '@reach/router';
import {
  ArrowSmLeftIcon,
  CollectionIcon,
  PaperAirplaneIcon,
  PencilIcon,
  RefreshIcon,
  TrashIcon,
} from '@heroicons/react/outline';

import Button from '../components/Button';
import DeleteConfirmation from '../components/DeleteConfirmation';
import { applyPreset, useDispatch, useGetPresetQuery, useRemovePresetMutation, useSelector } from '../store';
import { Type } from '../store/display';

interface Props extends RouteComponentProps {
  name?: string;
}

const PresetDetail = ({ name }: Props): JSX.Element => {
  // A preset name must always be preset
  if (name === undefined) throw Error("a preset 'name' must be provided");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, isLoading } = useGetPresetQuery(name);
  const [deletePreset, { isLoading: isDeleteLoading }] = useRemovePresetMutation();

  // Track the state of the modals
  const [alertOpen, setAlertOpen] = useState(false);
  // TODO: add edit modal

  // Determine if the preset is applied to the lights
  const isApplied = useSelector((state) => state.display.type === Type.Preset && state.display.preset === name);

  const backButton = (
    <Button className="mt-3" onClick={() => navigate('/presets')} secondary={data !== undefined}>
      <ArrowSmLeftIcon className="-ml-1 mr-1 h-5 w-5" />
      Back
    </Button>
  );

  const onDeleteCallback = async () => {
    deletePreset(name);
    setAlertOpen(false);
    await navigate('/presets');
  };

  // Display loading spinner
  if (isLoading) {
    return (
      <div className="mt-3 pt-12 pb-6 text-center">
        <RefreshIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Display not found
  if (data === undefined) {
    return (
      <div className="mt-3 border-2 border-gray-300 border-dashed rounded-lg p-12 text-center">
        <CollectionIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{name} not found</h3>
        <p className="mt-1 text-sm text-gray-500">The preset you are looking for couldn&apos;t be found.</p>
        {backButton}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Button onClick={() => dispatch(applyPreset(data.name))}>
          <PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" />
          Apply
        </Button>
        <Button secondary={true}>
          <PencilIcon className="-ml-1 mr-2 h-5 w-5" />
          Edit
        </Button>
      </div>
      <div className="mt-5 border-t border-b border-gray-300">
        <dl className="sm:divide-y sm:divide-gray-300">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{data.name}</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Brightness</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{data.brightness}%</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{isApplied ? 'In Use' : 'Ready'}</dd>
          </div>
        </dl>
      </div>
      <div className="flex items-center justify-between">
        {backButton}
        <Button
          className="mt-3 text-red-600 bg-red-200 hover:bg-red-300"
          onClick={() => setAlertOpen(true)}
          disabled={isDeleteLoading}
        >
          <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
          Delete
        </Button>
      </div>
      <DeleteConfirmation
        open={alertOpen}
        close={() => setAlertOpen(false)}
        callback={onDeleteCallback}
        title="Delete preset"
        description="Are you sure you want to delete this preset? All of the associated data will be permanently removed from the server forever. If the preset is currently applied, the lights will not change."
      />
    </>
  );
};
export default PresetDetail;
