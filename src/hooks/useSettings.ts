import { useEffect, useState } from "react";
import { HookState } from "./../state/state.utils";
import {
  SettingsStoreKey,
  SettingsStoreInstance,
  SettingsStore
} from "state/settings-store";

const getState = <T extends SettingsStoreKey[]>(K: T) => {
  const global = SettingsStore.getState();
  const target = {} as HookState<typeof K, SettingsStoreInstance>;
  const init = K.reduce((agg, k) => ({ ...agg, [k]: global[k] }), target);
  return init;
};

/** Attach a component to pending/recent changes to user settings (localStorage) */
export default function useSettings<T extends SettingsStoreKey[]>(K: T) {
  const [state, setState] = useState(getState(K));
  const onStateUpdate = () => setState(getState(K));
  useEffect(() => SettingsStore.subscribeToKeys(onStateUpdate, K), []);

  return Object.assign({}, state);
}
