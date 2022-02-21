import { useAuth0 } from '@auth0/auth0-react';
import React, { useEffect } from 'react';

import { Scope, login, useDispatch, useSelector } from '../store';

const AuthHandler = (): JSX.Element => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();
  const isConnected = useSelector((state) => state.ws.connected);

  useEffect(() => {
    (async () => {
      // Prevent too many get token requests being sent and the user being logged out
      if (!isAuthenticated) return;

      try {
        const token = await getAccessTokenSilently({
          audience: 'https://lights.krantz.dev',
          scope: Object.values(Scope).join(' '),
        });
        dispatch(login(token));
      } catch {}
    })();
  }, [isAuthenticated, isConnected]);

  return <></>;
};

export default AuthHandler;
