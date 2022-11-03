import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React from 'react';

import Card from './Card';

const SuspenseLoading = (): JSX.Element => (
  <Card>
    <div className="mt-3 pt-12 pb-6 text-center">
      <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
    </div>
  </Card>
);

export default SuspenseLoading;
