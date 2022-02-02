import { createAction } from '@reduxjs/toolkit';
import { Action } from 'redux';

/**
 * Initiate a connection to the given websocket server
 * @param url the URL of the server
 */
export const connect = createAction('websocket/connect');
/**
 * Disconnect from the current server
 */
export const disconnect = createAction('websocket/disconnect');
/**
 * Send an arbitrary message to the server
 * @param message some data to send
 */
export const send = createAction<unknown>('websocket/send');

// Internal action creators
export const beginReconnect = createAction('websocket/reconnect/begin');
export const attemptReconnect = createAction<number>('websocket/reconnect/attempt');
export const reconnected = createAction('websocket/reconnect/complete');
export const broken = createAction('websocket/connection/broken');
export const closed = createAction('websocket/connection/closed', (event: CloseEvent) => ({
  payload: { code: event.code, clean: event.wasClean },
}));
export const error = createAction('websocket/connection/error', (originalAction: Action | null, error: Error) => ({
  payload: {
    originalAction,
    name: error.name,
    message: error.message,
  },
}));
export const message = createAction('websocket/connection/message', (event: MessageEvent) => ({
  payload: JSON.parse(event.data),
}));
export const opened = createAction('websocket/connection/opened');
