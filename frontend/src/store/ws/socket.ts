import { Action, Dispatch, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';

import { attemptReconnect, beginReconnect, broken, closed, error, opened, reconnected } from './actions';

// Create an exponential backoff strategy with a maximum duration of 30s
const exponentialBackoff = (fn: () => void) => {
  let timeoutId: NodeJS.Timeout | null;
  let attempts = 0;

  const executor = () => {
    fn();

    attempts++;
    const delay = 1000 + (2 ** attempts / 8) * 1000;
    timeoutId = setTimeout(executor, delay > 30000 ? 30000 : delay);
  };

  // Kick-off the timer
  timeoutId = setTimeout(executor, 1000);

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
};

export default class Socket {
  private ws: WebSocket | null = null;

  // Track reconnection state
  private reconnectionClear: (() => void) | null = null;
  private reconnectionAttempts = 0;
  private reconnectionQueue: string[] | null = null;

  /**
   * Connect to the server
   */
  connect = ({ dispatch }: MiddlewareAPI) => this.open(dispatch);

  /**
   * Disconnect from the server
   * @throws {Error} WebSocket connection must be initialized
   */
  disconnect = () => {
    if (this.ws) this.close();
    else throw new Error('WebSocket not initialized');
  };

  /**
   * Send a message to the server
   * @throws {Error} Websocket connection must be initialized
   */
  send = <T>(action: Action<string> | PayloadAction<T>) => {
    const message = JSON.stringify(action);
    this.sendMessage(message);
  };

  /**
   * Handle a server-side close event
   */
  private onClose = (dispatch: Dispatch) => (event: CloseEvent) => {
    dispatch(closed(event));

    if (this.canAttemptReconnect()) this.reconnect(dispatch);
  };

  /**
   * Handle errors occurring in the connection
   */
  private onError = (dispatch: Dispatch) => () => {
    dispatch(error(null, new Error('an error occurred in the connection')));

    if (this.canAttemptReconnect()) this.reconnect(dispatch);
  };

  /**
   * Handle the connection opening
   */
  private onOpen = (dispatch: Dispatch) => () => {
    // Cleanup stuff from reconnection
    if (this.reconnectionClear) {
      this.reconnectionClear();

      // Clear the queued messages
      this.reconnectionQueue?.map((message) => this.sendMessage(message));
      this.reconnectionQueue = null;

      dispatch(reconnected());
    }

    // Mark that we've opened the connection
    dispatch(opened());
  };

  /**
   * Handle messages being received
   */
  private onMessage = (dispatch: Dispatch) => (event: MessageEvent) => {
    const action: Action = JSON.parse(event.data);
    dispatch(action);
  };

  /**
   * Handle the actual connection logic
   */
  private open = (dispatch: Dispatch) => {
    // Close the old connection
    this.close();

    // Connect to the server
    this.ws = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL || 'ws://127.0.0.1:4000/ws');

    // Register event listeners
    this.ws.addEventListener('close', this.onClose(dispatch));
    this.ws.addEventListener('error', this.onError(dispatch));
    this.ws.addEventListener('open', this.onOpen(dispatch));
    this.ws.addEventListener('message', this.onMessage(dispatch));
  };

  /**
   * Handle the sending logic
   * @throws {Error} Websocket connection must be initialized
   */
  private sendMessage = (message: string) => {
    if (this.ws) this.ws.send(message);
    else if (this.reconnectionClear !== null) this.reconnectionQueue?.push(message);
    else throw new Error('WebSocket not initialized');
  };

  /**
   * Close the connection
   * @param code a numeric code explaining why the connection was closed
   * @param reason a human-readable explanation for the closing
   */
  private close = (code?: number, reason?: string) => {
    if (this.ws) {
      this.ws.close(code || 1000, reason || 'WebSocket connection closed');
      this.ws = null;
    }
  };

  /**
   * Start the reconnection process
   */
  private reconnect = (dispatch: Dispatch) => {
    this.ws = null;

    // Notfiy we disconnected
    dispatch(broken());
    dispatch(beginReconnect());

    // Notify attempting reconnection
    this.reconnectionQueue = [];
    this.reconnectionAttempts = 1;
    dispatch(attemptReconnect(this.reconnectionAttempts));

    // Initiate a reconnection
    this.open(dispatch);

    // Continuously attempt reconnection with exponential backoff
    this.reconnectionClear = exponentialBackoff(() => {
      // Notify attempting reconnection
      this.reconnectionAttempts++;
      dispatch(attemptReconnect(this.reconnectionAttempts));

      this.open(dispatch);
    });
  };

  /**
   * Only attempt reconnection if we are not currently trying to reconnect.
   */
  private canAttemptReconnect = (): boolean => this.reconnectionClear == null;
}
