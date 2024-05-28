import { useEffect, useState } from "react";
import { HookState } from "./../state/state.utils";
import {
  SettingsStoreKey,
  SettingsStoreInstance,
  SettingsStore
} from "state/settings-store";

const updateStateObject = (K: SettingsStoreKey[]) => {
  type State = HookState<typeof K, SettingsStoreInstance>;
  const initial = SettingsStore.getState();
  return K.reduce((agg, k) => ({ ...agg, [k]: initial[k] }), {} as State);
};

/** Attach a component to pending/recent changes to user settings (localStorage) */
export default function useSettings(K: SettingsStoreKey[] = []) {
  type State = HookState<typeof K, SettingsStoreInstance>;
  const [state, setState] = useState<State>(updateStateObject(K));
  const onStateUpdate = () => setState(updateStateObject(K));
  useEffect(() => SettingsStore.subscribeToKeys(onStateUpdate, K), []);

  return { ...state } as State;
}
