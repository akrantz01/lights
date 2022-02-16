import { ArrowSmLeftIcon, ClockIcon, RefreshIcon, TrashIcon } from '@heroicons/react/outline';
import { RouteComponentProps, useNavigate } from '@reach/router';
import React, { useState } from 'react';

import Button from '../components/Button';
import Card from '../components/Card';
import DeleteConfirmation from '../components/DeleteConfirmation';
import DescriptionList from '../components/DescriptionList';
import { useGetScheduleQuery, useRemoveScheduleMutation, useUpdateScheduleMutation } from '../store';
import { Color, ScheduleRepeats, ScheduleType } from '../types';
import TypeSelectField from './TypeSelectField';

// Decode the "repeats" field from a number to a list of days
const decodeRepeats = (repeats: number): string => {
  if (repeats === 0) return 'never';

  // Determine if each day is set
  const days = [];
  if ((repeats & ScheduleRepeats.Sunday) === ScheduleRepeats.Sunday) days.push('Sun');
  if ((repeats & ScheduleRepeats.Monday) === ScheduleRepeats.Monday) days.push('Mon');
  if ((repeats & ScheduleRepeats.Tuesday) === ScheduleRepeats.Tuesday) days.push('Tues');
  if ((repeats & ScheduleRepeats.Wednesday) === ScheduleRepeats.Wednesday) days.push('Wed');
  if ((repeats & ScheduleRepeats.Thursday) === ScheduleRepeats.Thursday) days.push('Thurs');
  if ((repeats & ScheduleRepeats.Friday) === ScheduleRepeats.Friday) days.push('Fri');
  if ((repeats & ScheduleRepeats.Saturday) === ScheduleRepeats.Saturday) days.push('Sat');

  if (days.length === 7) return 'everyday';
  else return days.join(', ');
};

// Convert the time from 24hr to 12hr
const formatTime = (time: string): string => {
  const [hours24, minutes] = time.split(':').map((s) => parseInt(s));
  const pm = hours24 > 12;
  const hours = pm ? hours24 - 12 : hours24 === 0 ? 12 : hours24;

  return `${hours}:${minutes} ${pm ? 'PM' : 'AM'}`;
};

interface Props extends RouteComponentProps {
  name?: string;
}

const ScheduleDetail = ({ name }: Props): JSX.Element => {
  // A name must always be present
  if (name === undefined) throw Error("a schedule 'name' must be provided");

  const navigate = useNavigate();

  const { data, isLoading } = useGetScheduleQuery(name);
  const [updateSchedule] = useUpdateScheduleMutation();
  const [deleteSchedule, { isLoading: isDeleteLoading }] = useRemoveScheduleMutation();

  // Track state of modals
  const [alertOpen, setAlertOpen] = useState(false);

  const backButton = (
    <Button
      className="mt-3"
      onClick={() => navigate('/schedules')}
      style={data === undefined ? 'secondary' : 'primary'}
    >
      <ArrowSmLeftIcon className="-ml-1 mr-1 h-5 w-5" />
      Back
    </Button>
  );

  const onDeleteCallback = async () => {
    deleteSchedule(name);
    setAlertOpen(false);
    await navigate('/schedules');
  };

  // Display loading spinner
  if (isLoading) {
    return (
      <Card>
        <div className="mt-3 pt-12 pb-6 text-center">
          <RefreshIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
        </div>
      </Card>
    );
  }

  // Display not found
  if (data === undefined) {
    return (
      <Card>
        <div className="mt-3 border-2 border-gray-300 border-dashed rounded-lg p-12 text-center">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{name} not found</h3>
          <p className="mt-1 text-sm text-gray-500">The schedule you are looking for could&apos;t be found.</p>
          {backButton}
        </div>
      </Card>
    );
  }

  // Retrieve the value based on the type of schedule
  const value = {
    [ScheduleType.Fill]: data.color as Color,
    [ScheduleType.Preset]: data.preset as string,
    [ScheduleType.Animation]: data.animation as string,
  }[data.type];

  // Handle saving the schedule type
  const onScheduleTypeSave = (type: ScheduleType, value: string | Color) => {
    if (type === ScheduleType.Fill) updateSchedule({ id: data.id, type, color: value as Color });
    else if (type === ScheduleType.Preset) updateSchedule({ id: data.id, type, preset: value as string });
    else if (type === ScheduleType.Animation) updateSchedule({ id: data.id, type, animation: value as string });
  };

  return (
    <Card>
      <DescriptionList
        name={data.name}
        description="Schedule details and information."
        onSave={(v) => updateSchedule({ id: data.id, name: v })}
      >
        <DescriptionList.Field
          name="Status"
          value={data.enabled}
          onSave={(v) => updateSchedule({ id: data.id, enabled: v })}
          input={DescriptionList.BooleanInput}
          displayFn={(v) => (v ? 'Enabled' : 'Disabled')}
        />
        <DescriptionList.Field
          name="Runs At"
          value={data.at}
          onSave={(v) => updateSchedule({ id: data.id, at: v })}
          input={DescriptionList.TimeInput}
          displayFn={formatTime}
        />
        <DescriptionList.Field
          name="Repeats"
          value={data.repeats}
          onSave={(v) => updateSchedule({ id: data.id, repeats: v })}
          input={DescriptionList.BitwiseCheckboxInput({
            Sunday: ScheduleRepeats.Sunday,
            Monday: ScheduleRepeats.Monday,
            Tuesday: ScheduleRepeats.Tuesday,
            Wednesday: ScheduleRepeats.Wednesday,
            Thursday: ScheduleRepeats.Thursday,
            Friday: ScheduleRepeats.Friday,
            Saturday: ScheduleRepeats.Saturday,
          })}
          displayFn={decodeRepeats}
        />
        <TypeSelectField value={value} type={data.type} onSave={onScheduleTypeSave} />
      </DescriptionList>
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
        title="Delete schedule"
        description="Are you sure you want to delete this schedule? All of the associated data will be permanently removed from the server forever."
      />
    </Card>
  );
};

export default ScheduleDetail;
