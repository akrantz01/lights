import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import Card from './components/Card';

const NotFound = (): JSX.Element => {
  const location = useLocation();

  return (
    <Card>
      <div className="text-center py-20">
        <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Page not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          We couldn&apos;t find the page (
          <code className="font-mono bg-neutral-200 rounded-sm">{location.pathname}</code>) you were looking for. Please
          check it&apos;s correct and try again, or go back to the dashboard.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Back to the dashboard
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default NotFound;
