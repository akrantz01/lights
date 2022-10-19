import React, { useEffect } from 'react';

import { fetchCachedToken } from '../oauth';
import { login, setProfile, useDispatch, useSelector } from '../store';

const AuthHandler = (): JSX.Element => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.authentication.token);
  const isConnected = useSelector((state) => state.ws.connected);

  useEffect(() => {
    if (!isConnected) return;

    // TODO: implement usage of refresh tokens

    if (token) {
      dispatch(login(token));
      return;
    }

    // Only read from localstorage if there is not a token already in-memory
    const cache = fetchCachedToken();
    if (cache) {
      dispatch(setProfile(cache.profile));
      dispatch(login(cache.token));
    }
  }, [token, isConnected]);

  return <></>;
};

export default AuthHandler;
