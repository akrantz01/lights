export interface Action {
  type: string;
  meta: {
    timestamp: Date;
  };
  error?: boolean;
}

export interface PayloadAction<T> extends Action {
  payload: T;
}

export interface ConnectPayload {
  url: string;
}
