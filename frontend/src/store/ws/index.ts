import middleware from './middleware';
import reducer from './reducer';

export default {
  middleware: middleware(),
  reducer,
};

// Re-export dispatchers
export { connect, disconnect, send } from './actions';
