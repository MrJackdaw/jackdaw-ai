import { updateAsError, updateNotification } from "state/notifications";
import { LS_EMBEDDER_APIKEY, LS_EMBEDDER_KEY } from "../utils/strings";
import { MBoxStoreInstance, MBoxStore } from "./mbox-store";
import { stringToColor, updateUserSettings } from "utils/general";
import { SettingsStore } from "state/settings-store";

type WorkerResponseData = { data: any } & ResponseCore;
type WorkerStateUpdate = { state: MBoxStoreInstance } & ResponseCore;
type WorkerUpdate = (WorkerResponseData | WorkerStateUpdate) &
  Record<string, any>;
type ResponseStatus = "ok" | "error" | "loading";
type ResponseCore = { message: string; status: ResponseStatus };

export const Parser = new Worker(
  new URL("/workers/Mbox.Parser.mjs", import.meta.url).href,
  { type: "module", credentials: "include", name: "Parser" }
);

let subscribed = false;

/** Initialize connection to web workers. Must be called AFTER initializing user state */
export function initializeMboxModule() {
  if (subscribed) return;
  subscribed = true;

  Parser.addEventListener("message", onWorkerUpdate);
  window.addEventListener("beforeunload", () => {
    Parser.removeEventListener("message", onWorkerUpdate);
  });

  const { enableCloudStorage, owner } = SettingsStore.getState();
  sendParserMessage("Mbox.initialize", {
    owner,
    enableCloudStorage,
    embedder: localStorage.getItem(LS_EMBEDDER_KEY),
    apiKey: localStorage.getItem(LS_EMBEDDER_APIKEY)
  });
}

/**
 * Update UI state when Web Worker state changes
 * @param e Message from Web Worker
 */
function onWorkerUpdate(e: MessageEvent<WorkerUpdate>) {
  if (e.data.message !== "Mbox.State::Update") return;
  const update = (e.data as WorkerStateUpdate).state;
  if (!update) throw new Error("missing key 'state' in worker update data");
  if (e.data.status !== "ok") {
    const msg: string =
      e.data.error?.message ??
      (e.data.error ? JSON.stringify(e.data.error) : "Error updating worker");
    return void updateAsError(msg);
  }

  const { messagesLoaded } = MBoxStore.getState();
  if (update.messagesLoaded && !messagesLoaded) {
    updateNotification("Inbox loaded");
  }
  return MBoxStore.multiple(update);
}

export function clearParserModelCache() {
  changeMboxOwner();
  sendParserMessage("Mbox.clearCache");
}

export function changeMboxOwner(owner: string = "") {
  sendParserMessage("Mbox.changeOwner", { owner });
  SettingsStore.multiple({ owner, colorIdent: stringToColor(owner) });
  updateUserSettings(SettingsStore.getState());
}

type ParserAction =
  | "x::Mbox.parsePDF"
  | "Mbox.initialize"
  | "Mbox.parseFile"
  | "Mbox.searchVectors"
  | "Mbox.clearCache"
  | "Mbox.clearEmails"
  | "Mbox.changeOwner"
  | "Mbox.changeEmbedder";

export function sendParserMessage(
  action: ParserAction,
  data?: Record<string, any>
) {
  Parser.postMessage({ action, data });
}
