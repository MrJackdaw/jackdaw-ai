import createState from "@jackcom/raphsducks";
import { STATUS } from "./Workers.Utils.mjs";
import { RES_STATE_UPDATE } from "./Workers.Strings.mjs";

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

/** Copy of user settings from LocalStorage and IndexedDB */
export const MboxWorkerSettings = createState({
  aiProviderAPIKey: "",
  assistantLLM: "",
  colorIdent: "",
  embedder: "", // "@jackcom/openai*" | "huggingface" | "ollama" | "openai"
  enableCloudStorage: false,
  owner: "",
  selectedProject: undefined
});

/**
 * Export Worker state to UI listener
 * @param {Partial<ReturnType<typeof MboxWorkerStore.getState>>|null} state State updates to apply
 * @param {"ok"|"error"|"loading"} [status=STATUS.OK] Response status (default "ok")
 * @param {string|undefined} error (Optional) Response error details if any
 */
export function exportWorkerState(state = null, status = STATUS.OK, error) {
  if (state) MboxWorkerStore.multiple(state);
  if (error) exportWorkerAlert(error, "Error");

  self.postMessage({
    state: MboxWorkerStore.getState(),
    status,
    message: RES_STATE_UPDATE,
    error
  });
}

/**
 * Send a message that triggers a UI notification
 * @param {string} msg Alert to frontend
 * @param {"Info"|"Error"|"Warning"} type Type of Alert
 */
export function exportWorkerAlert(msg, type = "Info") {
  self.postMessage({
    message: `Mbox.Alert::${type}`,
    data: { msg, error: type === "Error", warning: type === "Warning" },
    status: STATUS.OK
  });
}
