import { Action, Middleware, MiddlewareAPI } from 'redux';
import Socket from './socket';
import { connect, disconnect, error, send } from './actions';

export default (): Middleware => {
  // Create the socket
  const socket = new Socket();

  return (store: MiddlewareAPI) => (next) => (action: Action) => {
    const { dispatch } = store;

    // Only handle our actions
    try {
      if (connect.match(action)) socket.connect(store);
      else if (disconnect.match(action)) socket.disconnect();
      else if (send.match(action)) socket.send(store, action);
    } catch (e) {
      // Attempt to handle the error
      if (e instanceof Error) dispatch(error(action, e));
      else throw e;
    }

    return next(action);
  };
};
