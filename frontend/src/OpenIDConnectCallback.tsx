import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import SuspenseLoading from './components/SuspenseLoading';
import { handleCallback } from './oauth';
import { useDispatch } from './store';

const OpenIDConnectCallback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await handleCallback(dispatch);
        navigate('/');
      } catch (e) {
        toast.error('Failed to login');
        console.error(e);
      }
    })();
  }, []);

  return <SuspenseLoading />;
};

export default OpenIDConnectCallback;
