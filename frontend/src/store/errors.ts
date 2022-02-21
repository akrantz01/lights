import { Middleware, isRejectedWithValue } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const errorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action) && action.payload.status !== 404) {
    toast.error(capitalize(action.payload.data.reason));
  }

  return next(action);
};

export default errorLogger;
