import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon, PaperAirplaneIcon, RectangleStackIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../components/Button';
import Card from '../components/Card';
import DeleteConfirmation from '../components/DeleteConfirmation';
import DescriptionList from '../components/DescriptionList';
import { UpdatablePixels } from '../components/form';
import {
  Scope,
  applyPreset,
  hasPermission,
  useDispatch,
  useGetPresetQuery,
  useRemovePresetMutation,
  useSelector,
  useUpdatePresetMutation,
} from '../store';

interface Props {
  name?: string;
}

const PresetDetail = ({ name }: Props): JSX.Element => {
  // A preset name must always be preset
  if (name === undefined) throw Error("a preset 'name' must be provided");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, isLoading } = useGetPresetQuery(name);
  const [updatePreset] = useUpdatePresetMutation();
  const [deletePreset, { isLoading: isDeleteLoading }] = useRemovePresetMutation();

  const canApply = useSelector(hasPermission(Scope.CONTROL_LIGHTS));
  const canEdit = useSelector(hasPermission(Scope.EDIT));

  // Track the state of the modals
  const [alertOpen, setAlertOpen] = useState(false);

  // Determine if the preset is applied to the lights
  const isApplied = useSelector((state) => state.display.preset === name);

  const backButton = (
    <Button className="mt-3" onClick={() => navigate('/presets')} style={data === undefined ? 'secondary' : 'primary'}>
      <ArrowLeftIcon className="-ml-1 mr-1 h-5 w-5" />
      Back
    </Button>
  );

  const onDeleteCallback = () => {
    deletePreset(name);
    setAlertOpen(false);
    navigate('/presets');
  };

  // Display loading spinner
  if (isLoading) {
    return (
      <Card>
        <div className="mt-3 pt-12 pb-6 text-center">
          <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
        </div>
      </Card>
    );
  }

  // Display not found
  if (data === undefined) {
    return (
      <Card>
        <div className="mt-3 border-2 border-gray-300 border-dashed rounded-lg p-12 text-center">
          <RectangleStackIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{name} not found</h3>
          <p className="mt-1 text-sm text-gray-500">The preset you are looking for couldn&apos;t be found.</p>
          {backButton}
        </div>
      </Card>
    );
  }

  const rightContent = (
    <Button style="primary" onClick={() => dispatch(applyPreset(data.id))} disabled={isApplied}>
      <PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" />
      {isApplied ? 'Applied' : 'Apply'}
    </Button>
  );

  return (
    <Card>
      <DescriptionList
        name={data.name}
        description="Preset configuration and details."
        onSave={(name) => updatePreset({ id: data.id, name })}
        rightContent={canApply ? rightContent : null}
        editable={canEdit}
      >
        <DescriptionList.Field
          name="Brightness"
          value={data.brightness}
          onSave={(brightness) => updatePreset({ id: data.id, brightness })}
          input={DescriptionList.SliderInput}
          editable={canEdit}
        />
        <UpdatablePixels
          values={data.pixels}
          onSave={(pixels) => updatePreset({ id: data.id, pixels })}
          editable={canEdit}
        />
      </DescriptionList>
      <div className="flex items-center justify-between">
        {backButton}
        {canEdit && (
          <Button
            className="mt-3 text-red-600 bg-red-200 hover:bg-red-300"
            onClick={() => setAlertOpen(true)}
            disabled={isDeleteLoading}
          >
            <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
            Delete
          </Button>
        )}
      </div>
      <DeleteConfirmation
        open={alertOpen}
        close={() => setAlertOpen(false)}
        callback={onDeleteCallback}
        title="Delete preset"
        description="Are you sure you want to delete this preset? All of the associated data will be permanently removed from the server forever. If the preset is currently applied, the lights will not change."
      />
    </Card>
  );
};
export default PresetDetail;
