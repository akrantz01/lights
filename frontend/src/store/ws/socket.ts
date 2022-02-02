import { Dispatch, MiddlewareAPI } from 'redux';

import { beginReconnect, attemptReconnect, reconnected, broken, closed, error, message, open } from './actions';
import { PayloadAction, ConnectPayload } from './types';

export default class Socket {
  private ws: WebSocket | null = null;
  private url: string | null = null;

  // Track number of reconnection attempts
  private reconnectionAttempts = 0;
  private reconnectionInterval: NodeJS.Timeout | null = null;

  // Keep track of if the connection has ever been opened successfully
  private opened = false;

  /**
   * Connect to the server
   */
  connect = ({ dispatch }: MiddlewareAPI, { payload }: PayloadAction<ConnectPayload>) => {
    this.url = payload.url;
    this.open(dispatch);
  };

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
  send = <T>(store: MiddlewareAPI, { payload }: PayloadAction<T>) => {
    if (this.ws) this.ws.send(JSON.stringify(payload));
    else throw new Error('WebSocket not initialized');
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
    dispatch(error(null, new Error()));

    if (this.canAttemptReconnect()) this.reconnect(dispatch);
  };

  /**
   * Handle the connection opening
   */
  private onOpen = (dispatch: Dispatch) => (event: Event) => {
    // Cleanup stuff from reconnection
    if (this.reconnectionInterval) {
      clearInterval(this.reconnectionInterval);
      this.reconnectionInterval = null;
      this.reconnectionAttempts = 0;

      dispatch(reconnected());
    }

    // Mark that we've opened the connection
    dispatch(open(event));
    this.opened = true;
  };

  /**
   * Handle messages being received
   */
  private onMessage = (dispatch: Dispatch) => (event: MessageEvent) => {
    dispatch(message(event));
  };

  /**
   * Handle the actual connection logic
   */
  private open = (dispatch: Dispatch) => {
    // Close the old connection
    this.close();

    // Connect to the server
    this.ws = new WebSocket(this.url as string);

    // Register event listeners
    this.ws.addEventListener('close', this.onClose(dispatch));
    this.ws.addEventListener('error', this.onError(dispatch));
    this.ws.addEventListener('open', this.onOpen(dispatch));
    this.ws.addEventListener('message', this.onMessage(dispatch));
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

    // Notfiy we disconnected
    dispatch(broken());
    dispatch(beginReconnect());

    // Notify attempting reconnection
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
