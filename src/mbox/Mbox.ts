import { SettingsStore } from "state/settings-store";
import {
  WORKER_CHANNEL,
  updateAsError,
  updateAsWarning,
  updateNotification
} from "state/notifications";
import { LS_AI_PROVIDER_APIKEY, LS_EMBEDDER_KEY } from "../utils/strings";
import { MBoxStoreInstance, MBoxStore } from "./mbox-store";
import { stringToColor, updateUserSettings } from "utils/general";

type WorkerResponseData = { data: any } & ResponseCore;
type WorkerStateUpdate = { state: MBoxStoreInstance } & ResponseCore;
type WorkerUpdate = (WorkerResponseData | WorkerStateUpdate) &
  Record<string, any>;
type ResponseStatus = "ok" | "error" | "loading";
type ResponseCore = { message: string; status: ResponseStatus };

/** Primary Web Worker that handles document parsing, embedding, and vector storage */
export const DocumentHandler = new Worker(
  new URL("/workers/Worker.Main.mjs", import.meta.url).href,
  { type: "module", credentials: "include", name: "Parser" }
);

let subscribed = false;

/** Initialize connection to web workers. Must be called AFTER initializing user state */
export function initializeMboxModule() {
  if (subscribed) return;
  subscribed = true;

  // Send initial user settings to Worker and alert whenever user settings change
  copySettingsToParser();
  const unsubscribe = SettingsStore.subscribe(copySettingsToParser);

  // Listen for any messages from Worker
  DocumentHandler.addEventListener("message", onWorkerUpdate);

  // Unsubscribe from Worker before window unloads
  window.addEventListener("beforeunload", () => {
    unsubscribe();
    DocumentHandler.removeEventListener("message", onWorkerUpdate);
  });

  sendParserMessage("Worker.initialize", {
    embedder: localStorage.getItem(LS_EMBEDDER_KEY),
    apiKey: localStorage.getItem(LS_AI_PROVIDER_APIKEY)
  });
}

/**
 * Update UI state when Web Worker state changes
 * @param e Message from Web Worker
 */
function onWorkerUpdate(e: MessageEvent<WorkerUpdate>) {
  if (e.data.message === "Worker.State::Update") {
    // Worker State update: pass into UI's mirror-state
    const update = (e.data as WorkerStateUpdate).state;
    if (!update) throw new Error("missing key 'state' in worker update data");
    return MBoxStore.multiple(update);
  }

  if (e.data.message.startsWith("Worker.FileSplit::")) {
    // Worker splits up a text file into segments, then zips them up. Allow
    // user to download zip file.
    const { zipFile, fileName } = e.data.data;
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipFile);
    downloadLink.download = fileName;
    downloadLink.click();
  }

  if (e.data.message.startsWith("Worker.Alert::")) {
    // Worker splits up a text file into segments, then zips them up. Allow
    // user to download zip file.
    const { msg, error, warning } = e.data.data;
    if (error) return updateAsError(msg, WORKER_CHANNEL);
    if (warning) return updateAsWarning(msg, WORKER_CHANNEL, true);
    return updateNotification(msg, WORKER_CHANNEL);
  }

  // This is now an edge-case
  if (e.data.status !== "ok") {
    const msg: string =
      e.data.error?.message ??
      (e.data.error ? JSON.stringify(e.data.error) : "Error updating worker");
    return void updateAsError(msg);
  }
}

export function clearParserModelCache() {
  changeMboxOwner();
  sendParserMessage("Worker.clearCache");
}

export function changeMboxOwner(owner: string = "") {
  SettingsStore.multiple({ owner, colorIdent: stringToColor(owner) });
  updateUserSettings(SettingsStore.getState());
}

/**
 * Creates a text file from the supplied string, and adds it to the current `Project` context
 * (or user memory if cloud storage disabled)
 * @param text Blurb to be added */
export function addTextToProjectContext(text: string) {
  const filename = `AssistantResponse-${Date.now()}`;
  const tempFile = new File([text], filename, { type: "text/plain" });
  return sendFilesToParser(tempFile);
}

/**
 * Adds a file to the current `Project` context (or user memory if cloud storage disabled).
 * This will first embed the file, then store the vectors as required (either in memory or db)
 * @param uploadedFile User-uploaded or -created file */
export function sendFilesToParser(
  uploadedFile?: File | null
): [fileName: string | null, errorMessage?: string] {
  if (!uploadedFile) return [null, "No file was uploaded"];

  try {
    const { owner, enableCloudStorage } = SettingsStore.getState();
    const fileName = uploadedFile.name;
    updateNotification(`Loading ${fileName}...`, WORKER_CHANNEL, true);
    sendParserMessage("Worker.parseFile", {
      file: uploadedFile,
      owner,
      enableCloudStorage
    });
    return [fileName];
  } catch (error) {
    const errorM = (error as Error)?.message ?? error?.toString();
    const fullM = `Worker.SendFilesToHandler.Error::${errorM ?? "No details"}`;
    return [null, fullM];
  }
}

/**
 * Splits a large text-based file up into smaller segments.
 * @param uploadedFile User-uploaded or -created file */
export function splitFileIntoSegments(
  uploadedFile?: File | null,
  numSegments = 5
) {
  if (!uploadedFile) return [null, "No file was uploaded"];

  try {
    const fileName = uploadedFile.name;
    updateNotification(`Splitting ${fileName}...`, WORKER_CHANNEL, true);
    sendParserMessage("Worker.splitFile", { file: uploadedFile, numSegments });
    return [fileName];
  } catch (error) {
    const errorM = (error as Error)?.message ?? error?.toString();
    const fullM = `Worker.SendFilesToHandler.Error::${errorM ?? "No details"}`;
    return [null, fullM];
  }
}

type ParserAction =
  | "Worker.initialize"
  | "Worker.parseFile"
  | "Worker.splitFile"
  | "Worker.searchVectors"
  | "Worker.clearCache"
  | "Worker.clearEmails"
  | "Worker.changeEmbedder"
  | "Worker.updateSettings";

/** Helper: Send a standardized message format to the active `Web Worker` */
export function sendParserMessage(
  action: ParserAction,
  data?: Record<string, any>
) {
  DocumentHandler.postMessage({ action, data });
}

/** Copy current user settings to `Worker` */
function copySettingsToParser() {
  const settings = () => ({ settings: SettingsStore.getState() });
  sendParserMessage("Worker.updateSettings", settings());
}
