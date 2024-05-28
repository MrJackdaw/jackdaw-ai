import createState from "@jackcom/raphsducks";
import { STATUS } from "./Mbox.Utils.mjs";
import { RES_STATE_UPDATE } from "./Mbox.Strings.mjs";

/** Values for loading */
export const STATE__LOADING = {
  loading: true,
  messagesLoaded: false,
  vectorStoreLoaded: false,
  docsCount: 0
};

/** Values for initial state */
export const STATE__INIT = {
  ...STATE__LOADING,
  initialized: false,
  loading: false
};

/** Shared worker state */
export const MboxWorkerStore = createState(STATE__INIT);

/**
 * Export Worker state to UI listener
 * @param {"ok"|"error"|"loading"} [status=STATUS.OK] Response status (default "ok")
 * @param {string} error (Optional) Response error details if any
 */
export function exportWorkerState__(status = STATUS.OK, error) {
  self.postMessage({
    state: MboxWorkerStore.getState(),
    status,
    message: RES_STATE_UPDATE,
    error
  });
}
