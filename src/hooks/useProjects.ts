import { useEffect, useState } from "react";
import { HookState } from "state/state.utils";
import {
  ProjectsStore,
  ProjectsStoreInstance,
  ProjectsStoreKey
} from "state/user-projects";

const getState = <T extends ProjectsStoreKey[]>(K: T) => {
  const global = ProjectsStore.getState();
  const target = {} as HookState<typeof K, ProjectsStoreInstance>;
  const init = K.reduce((agg, k) => ({ ...agg, [k]: global[k] }), target);
  return init;
};

/**
 * Hook to get the projects state
 * @param K List of state properties to subscribe to
 * @returns State with current values of any subscribed keys
 */
export default function useProjects<T extends ProjectsStoreKey[]>(K: T) {
  const [state, setState] = useState(getState(K));
  const handlers = { setLoading: ProjectsStore.fetchingProjects };

  useEffect(() => {
    const onState = () => setState(getState(K));
    return ProjectsStore.subscribeToKeys(onState, K);
  }, []);

  return { ...handlers, ...state };
}
