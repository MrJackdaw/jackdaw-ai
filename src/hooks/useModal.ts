import { useEffect, useState } from "react";
import {
  MODAL,
  ModalStoreInstance,
  ModalStore,
  clearModal,
  setModal
} from "state/modal";

type HookState = ModalStoreInstance;

/** Reusable subscription to `Modal` state  */
export default function useModal() {
  const gState = ModalStore.getState();
  const [state, setState] = useState<HookState>(gState);
  const onModal = (s: Partial<ModalStoreInstance>) =>
    setState((prev) => ({ ...prev, ...s }));

  useEffect(() => ModalStore.subscribe(onModal), []);

  return {
    ...state,
    MODAL,

    // Helpers
    clearModal,
    setModal
  };
}
