import { Action, Middleware, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';
import Socket from './socket';
import { connect, disconnect, error, send } from './actions';

export default (): Middleware => {
  // Create the socket
  const socket = new Socket();

  return (store: MiddlewareAPI) => (next) => (action: Action<string> | PayloadAction) => {
    const { dispatch } = store;
    const { type } = action;

    // Only handle our actions
    try {
      if (connect.match(action)) socket.connect(store);
      else if (disconnect.match(action)) socket.disconnect();
      else if (send.match(action)) socket.send(action);
    } catch (e) {
      // Attempt to handle the error
      if (e instanceof Error) dispatch(error(action, e));
      else throw e;
    }

    // Send server actions over the socket
    if (type.startsWith('server/')) socket.send(action);

    return next(action);
  };
};
