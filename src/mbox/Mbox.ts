import { SettingsStore } from "state/settings-store";
import { updateAsError, updateNotification } from "state/notifications";
import { LS_EMBEDDER_APIKEY, LS_EMBEDDER_KEY } from "../utils/strings";
import { MBoxStoreInstance, MBoxStore } from "./mbox-store";
import { stringToColor, updateUserSettings } from "utils/general";

type WorkerResponseData = { data: any } & ResponseCore;
type WorkerStateUpdate = { state: MBoxStoreInstance } & ResponseCore;
type WorkerUpdate = (WorkerResponseData | WorkerStateUpdate) &
  Record<string, any>;
type ResponseStatus = "ok" | "error" | "loading";
type ResponseCore = { message: string; status: ResponseStatus };

export const DocumentHandler = new Worker(
  new URL("/workers/Worker.Main.mjs", import.meta.url).href,
  { type: "module", credentials: "include", name: "Parser" }
);

let subscribed = false;

/** Initialize connection to web workers. Must be called AFTER initializing user state */
export function initializeMboxModule() {
  if (subscribed) return;
  subscribed = true;

  DocumentHandler.addEventListener("message", onWorkerUpdate);
  window.addEventListener("beforeunload", () => {
    DocumentHandler.removeEventListener("message", onWorkerUpdate);
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

export function sendFilesToParser(
  files: FileList | null
): [fileName: string | null, errorMessage?: string] {
  const [uploadedFile] = files ?? [];
  if (!uploadedFile) return [null, "No file was uploaded"];

  try {
    const { owner } = SettingsStore.getState();
    const fileName = uploadedFile.name;
    updateNotification(`Loading ${fileName}...`, undefined, true);
    sendParserMessage("Mbox.parseFile", { file: uploadedFile, owner });
    return [fileName];
  } catch (error) {
    const errorM = (error as Error)?.message ?? error?.toString();
    const fullM = `Mbox.SendFilesToHandler.Error::${errorM ?? "No details"}`;
    return [null, fullM];
  }
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
  DocumentHandler.postMessage({ action, data });
}
