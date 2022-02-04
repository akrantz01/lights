import React, { useState } from 'react';
import { ArrowSmLeftIcon, ClockIcon, PencilIcon, RefreshIcon, TrashIcon } from '@heroicons/react/outline';
import { Link, RouteComponentProps, useNavigate } from '@reach/router';

import Button from '../components/Button';
import DeleteConfirmation from '../components/DeleteConfirmation';
import { useGetScheduleQuery, useRemoveScheduleMutation } from '../store';
import { ScheduleRepeats, ScheduleType } from '../types';

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

interface Props extends RouteComponentProps {
  name?: string;
}

const ScheduleDetail = ({ name }: Props): JSX.Element => {
  // A name must always be present
  if (name === undefined) throw Error("a schedule 'name' must be provided");

  const navigate = useNavigate();

  const { data, isLoading } = useGetScheduleQuery(name);
  const [deleteSchedule, { isLoading: isDeleteLoading }] = useRemoveScheduleMutation();

  // Track state of modals
  const [alertOpen, setAlertOpen] = useState(false);
  // TODO: add edit modal

  const backButton = (
    <Button className="mt-3" onClick={() => navigate('/schedules')} secondary={data !== undefined}>
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
      <div className="mt-3 pt-12 pb-6 text-center">
        <RefreshIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Display not found
  if (data === undefined) {
    return (
      <div className="mt-3 border-2 border-gray-300 border-dashed rounded-lg p-12 text-center">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{name} not found</h3>
        <p className="mt-1 text-sm text-gray-500">The schedule you are looking for could&apos;t be found.</p>
        {backButton}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end">
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
            <dt className="text-sm font-medium text-gray-500">Runs At</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{data.at}</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Repeats</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{decodeRepeats(data.repeats)}</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">
              {data.type === ScheduleType.Fill && 'Fill'}
              {data.type === ScheduleType.Preset && 'Preset'}
              {data.type === ScheduleType.Animation && 'Animation'}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {data.type === ScheduleType.Fill && (
                <span
                  className="w-16 h-6 inline-block rounded"
                  style={{ background: `rgb(${data.color?.r}, ${data.color?.g}, ${data.color?.b})` }}
                />
              )}
              {data.type === ScheduleType.Preset && (
                <Link to={`/presets/${data.preset}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                  {data.preset}
                </Link>
              )}
              {data.type === ScheduleType.Animation && (
                <Link
                  to={`/animations/${data.animation}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {data.animation}
                </Link>
              )}
            </dd>
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
        title="Delete schedule"
        description="Are you sure you want to delete this schedule? All of the associated data will be permanently removed from the server forever."
      />
    </>
  );
};

export default ScheduleDetail;
