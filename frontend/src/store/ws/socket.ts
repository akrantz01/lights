import { Action, Dispatch, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';

import { attemptReconnect, beginReconnect, broken, closed, error, opened, reconnected } from './actions';

export default class Socket {
  private ws: WebSocket | null = null;

  // Track number of reconnection attempts
  private reconnectionAttempts = 0;
  private reconnectionInterval: NodeJS.Timeout | null = null;
  private reconnectionQueue: string[] | null = null;

  // Keep track of if the connection has ever been opened successfully
  private opened = false;

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
    toast.error('Server disconnected');

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
    if (this.reconnectionInterval) {
      clearInterval(this.reconnectionInterval);
      this.reconnectionInterval = null;
      this.reconnectionAttempts = 0;

      // Clear the queued messages
      this.reconnectionQueue?.map((message) => this.sendMessage(message));
      this.reconnectionQueue = null;

      dispatch(reconnected());

      toast.success('Reconnected');
    }

    // Mark that we've opened the connection
    dispatch(opened());
    this.opened = true;
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
    else if (this.reconnectionInterval !== null) this.reconnectionQueue?.push(message);
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
      this.opened = false;
    }
  };

  /**
   * Start the reconnection process
   */
  private reconnect = (dispatch: Dispatch) => {
    this.ws = null;

    toast.error('Reconnecting...', { icon: '⚠️' });

    // Notfiy we disconnected
    dispatch(broken());
    dispatch(beginReconnect());

    // Notify attempting reconnection
    this.reconnectionQueue = [];
    this.reconnectionAttempts = 1;
    dispatch(attemptReconnect(this.reconnectionAttempts));

    // Initiate a reconnection
    this.open(dispatch);

    // Continuously attempt reconnection every 2s
    this.reconnectionInterval = setInterval(() => {
      // Notify attempting reconnection
      this.reconnectionAttempts++;
      dispatch(attemptReconnect(this.reconnectionAttempts));

      this.open(dispatch);
    }, 2000);
  };

  /**
   * Only attempt reconnection if the connection has successfully opened at some point,
   * and we are not currently trying to reconnect.
   */
  private canAttemptReconnect = (): boolean => this.opened && this.reconnectionInterval == null;
}
