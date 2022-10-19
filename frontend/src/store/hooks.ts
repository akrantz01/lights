import { TypedUseSelectorHook, useDispatch as useReduxDispatch, useSelector as useReduxSelector } from 'react-redux';

import { ProfileState } from './authentication';
import { Dispatch, RootState } from './index';

export const useDispatch = () => useReduxDispatch<Dispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

export const useProfile = (): ProfileState | undefined => useSelector((state) => state.authentication.profile);
