import { Middleware, MiddlewareAPI } from 'redux';

import { ACTION_CONNECT, ACTION_DISCONNECT, ACTION_SEND, connect, disconnect, error, send } from './actions';
import Socket from './socket';
import { Action } from './types';

export default (): Middleware => {
  // Create the socket and register handlers
  const socket = new Socket();
  const handlers = {
    [ACTION_CONNECT]: socket.connect,
    [ACTION_DISCONNECT]: socket.disconnect,
    [ACTION_SEND]: socket.send,
  };

  return (store: MiddlewareAPI) => (next) => (action: Action) => {
    const { dispatch } = store;
    const { type } = action;

    // Only handle our actions
    if (type.startsWith('websocket/')) {
      const handler = Reflect.get(handlers, type);

      if (handler) {
        try {
          handler(store, action);
        } catch (e) {
          // Attempt to handle the error
          if (e instanceof Error) dispatch(error(action, e));
          else throw e;
        }
      }
    }

    return next(action);
  };
};

// Re-export dispatchers
export { connect, disconnect, send };
