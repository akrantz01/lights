import { Middleware, createAction, isRejectedWithValue } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';

import { Scope } from './authentication';

const notFoundError = createAction<string>('error/notFound');
const permissionsError = createAction<Scope>('error/permissions');

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const errorLogger: Middleware = () => (next) => (action) => {
  // Handle not found errors
  if (notFoundError.match(action)) {
    toast.error(`${capitalize(action.payload)} no longer exists`);
  }

  // Handle permissions errors
  if (permissionsError.match(action)) {
    const [method, resource] = action.payload.split(':');
    toast.error(`Missing permission to ${method} the ${resource}.`);
  }

  // Handle RTK Query errors
  if (isRejectedWithValue(action) && action.payload.status !== 404) {
    toast.error(capitalize(action.payload.data.reason));
  }

  return next(action);
};

export default errorLogger;
