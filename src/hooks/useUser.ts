import { useEffect, useState } from "react";
import { UserStore, UserStoreInstance, UserStoreInstanceKey } from "state/user";
import { HookState } from "state/state.utils";

const defaultKeys = Object.keys(UserStore.getState()) as UserStoreInstanceKey[];
const getState = <T extends UserStoreInstanceKey[]>(K: T) => {
  const global = UserStore.getState();
  const target = {} as HookState<typeof K, UserStoreInstance>;
  const init = K.reduce((agg, k) => ({ ...agg, [k]: global[k] }), target);
  return init;
};
/**
 * Listen for specific `User` data from global state.
 * @returns User data
 */
export default function useUser<T extends UserStoreInstanceKey[]>(
  K = defaultKeys
): Pick<UserStoreInstance, T[number]> {
  // Initialize internal state, and create a function that responds to
  // changes in global state
  const [state, setState] = useState(getState(K));
  const onAppState = () => setState(getState(K));

  // Subscribe to global state: unsubscribe on component unmount
  useEffect(() => UserStore.subscribeToKeys(onAppState, K), []);

  return Object.assign({}, state);
}
