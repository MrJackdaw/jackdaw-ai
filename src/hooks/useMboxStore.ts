import {
  MBoxStore,
  MBoxStoreInstance,
  MBoxStoreInstanceKey
} from "mbox/mbox-store";
import { useState, useEffect } from "react";
import { HookState } from "state/state.utils";

const getState = <T extends MBoxStoreInstanceKey[]>(K: T) => {
  const global = MBoxStore.getState();
  const target = {} as HookState<typeof K, MBoxStoreInstance>;
  const init = K.reduce((agg, k) => ({ ...agg, [k]: global[k] }), target);
  return init;
};

/** Attach to `Mbox` store */
export function useMboxStore(k: MBoxStoreInstanceKey[] = []) {
  const [local, setLocal] = useState(getState(k));
  // return unsubscriber
  useEffect(
    () => MBoxStore.subscribeToKeys(() => setLocal(getState(k)), k),
    []
  );

  return { ...local };
}
