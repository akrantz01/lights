import { RouteComponentProps, useNavigate } from '@reach/router';
import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';

import SuspenseLoading from './components/SuspenseLoading';
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

  return <SuspenseLoading />;
};

export default OpenIDConnectCallback;
