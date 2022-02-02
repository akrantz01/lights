import { PayloadAction, Action, ConnectPayload } from './types';

// Connection management/status
const CONNECTION_BROKEN = 'websocket/connection/broken';
const CONNECTION_CLOSED = 'websocket/connection/closed';
const CONNECTION_ERROR = 'websocket/connection/error';
const CONNECTION_OPEN = 'websocket/connection/opened';
const CONNECTION_MESSAGE = 'websocket/connection/message';

// Reconnection management/status
const RECONNECT_BEGIN = 'websocket/reconnect/begin';
const RECONNECT_ATTEMPT = 'websocket/reconnect/attempt';
const RECONNECT_COMPLETE = 'websocket/reconnect/complete';

// Actions sent by the application
export const ACTION_CONNECT = 'websocket/connect';
export const ACTION_DISCONNECT = 'websocket/disconnect';
export const ACTION_SEND = 'websocket/send';

/**
 * Create an FSA compliant action
 * @param type the type of action to build
 * @param payload data to send with action
 */
function build<T>(type: string, payload?: T): Action | PayloadAction<T> {
  const base: Action = {
    type,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  if (payload instanceof Error) base.error = true;

  return payload ? { ...base, payload } : base;
}

/**
 * Initiate a connection to the given websocket server
 * @param url the URL of the server
 */
export const connect = (url: string) => build<ConnectPayload>(ACTION_CONNECT, { url });
/**
 * Disconnect from the current server
 */
export const disconnect = () => build(ACTION_DISCONNECT);
/**
 * Send an arbitrary message to the server
 * @param message some data to send
 */
export const send = <T>(message: T) => build<T>(ACTION_SEND, message);

// Internal action creators
export const beginReconnect = () => build(RECONNECT_BEGIN);
export const attemptReconnect = (attemptNumber: number) => build(RECONNECT_ATTEMPT, { count: attemptNumber });
export const reconnected = () => build(RECONNECT_COMPLETE);
export const broken = () => build(CONNECTION_BROKEN);
export const closed = (event: CloseEvent) => build(CONNECTION_CLOSED, { code: event.code, clean: event.wasClean });
export const error = <T>(originalAction: Action | PayloadAction<T> | null, error: Error) =>
  build(CONNECTION_ERROR, { message: error.message, name: error.name, originalAction });
export const message = (event: MessageEvent) => build(CONNECTION_MESSAGE, { message: JSON.parse(event.data) });
export const open = () => build(CONNECTION_OPEN);
