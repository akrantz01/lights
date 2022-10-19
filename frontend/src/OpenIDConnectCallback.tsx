import { RefreshIcon } from '@heroicons/react/outline';
import { RouteComponentProps, useNavigate } from '@reach/router';
import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';

import Card from './components/Card';
import { handleCallback } from './oauth';
import { useDispatch } from './store';

const OpenIDConnectCallback: React.FC<RouteComponentProps> = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await handleCallback(dispatch);
        await navigate('/');
      } catch (e) {
        toast.error('Failed to login');
        console.error(e);
      }
    })();
  }, []);

  return (
    <Card>
      <div className="flex justify-center py-16">
        <RefreshIcon className="h-32 w-32 rounded-full text-gray-500 animate-spin" />
      </div>
    </Card>
  );
};

export default OpenIDConnectCallback;
