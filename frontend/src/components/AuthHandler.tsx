import React, { useEffect } from 'react';

import { login, useDispatch, useSelector } from '../store';

const AuthHandler = (): JSX.Element => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.authentication.token);
  const isConnected = useSelector((state) => state.ws.connected);

  useEffect(() => {
    (async () => {
      // Prevent too many get token requests being sent and the user being logged out
      if (!token) return;

      // TODO: persist token in localstorage/sessionstorage & implement usage of refresh tokens

      dispatch(login(token));
    })();
  }, [token, isConnected]);

  return <></>;
};

export default AuthHandler;
