import { STATUS, clearCachedModels, workerError } from "./Workers.Utils.mjs";
import { ERR_NO_ACTION, ERR_NO_DATA } from "./Workers.Strings.mjs";
import { initializeWorker, resetWorker, parseFile } from "./Workers.Parser.mjs";
import { setActiveEmbedder } from "./Workers.ActiveEmbedder.mjs";
import {
  MboxWorkerSettings,
  MboxWorkerStore,
  exportWorkerAlert
} from "./Workers.State.mjs";
import { searchVectors } from "./Workers.VectorStore.mjs";
import { splitTextFile } from "./Workers.SplitFile.mjs";

/**
 * Main function: handles and routes all messages received (or reports error)
 * @typedef {MessageEvent<{action: string; data: Record<string, any>}>} WorkerMessage
 * @param {WorkerMessage} event Event data from caller
 */
function workerMain(event) {
  const { action, data } = event.data;

  switch (action) {
    case "Worker.initialize": {
      // Post a message whenever the worker state changes
      attachParserToUI();
      // Ensure the user has set an API key, or let them know they haven't and halt startup
      if (CheckAPIKeyRequired(data)) {
        const embedder = data.embedder.split("/")[0];
        const err = `Please set your API Key for provider "${embedder}"`;
        return exportWorkerAlert(err, "Error");
      }
      // Prepare worker for ingesting data
      return initializeWorker(data);
    }

    // Clear cached values
    case "Worker.clearCache": {
      return clearCachedModels();
    }

    // Split up a file
    case "Worker.splitFile": {
      return data
        ? splitTextFile(data.file, data.numSegments)
        : workerError(ERR_NO_DATA);
    }

    // Load a file
    case "Worker.parseFile": {
      return data
        ? parseFile(data.file, data.owner, data.enableCloudStorage)
        : workerError(ERR_NO_DATA);
    }

    // Find relevant vectors: Expects a query string at `e.data.data`
    case "Worker.searchVectors": {
      return data.query ? searchVectors(data.query) : workerError(ERR_NO_DATA);
    }

    case "Worker.clearEmails": {
      return resetWorker();
    }

    case "Worker.changeEmbedder": {
      return data
        ? setActiveEmbedder(data.embedder, data.apiKey)
        : workerError(ERR_NO_DATA);
    }

    case "Worker.updateSettings": {
      return data.settings
        ? MboxWorkerSettings.multiple(data.settings)
        : MboxWorkerSettings.reset();
    }

    default: {
      console.log({ action, data });
      return workerError(ERR_NO_ACTION, action);
    }
  }
}

/**
 * Unsubscribes Inbox state listener.
 * @type {import("@jackcom/raphsducks/lib/types").Unsubscriber}*/
let unsubscribePublisher;

/** Notify UI thread when Inbox state changes */
function attachParserToUI() {
  if (unsubscribePublisher) return;

  unsubscribePublisher = MboxWorkerStore.subscribe((d) =>
    self.postMessage({
      state: d,
      status: STATUS.OK,
      message: "Worker.State::Update"
    })
  );
}

/** Early check to verify (or alert user of) presence of API Key */
function CheckAPIKeyRequired({ apiKey, embedder }) {
  if (isJackCOMStr__W(embedder)) return false;
  return Boolean(!apiKey);
}

export function isJackCOMStr__W(s) {
  if (!s) return false;
  return /^(@jackcom\/)/gi.test(s);
}

export function isTogetherAIStr__W(s) {
  if (!s) return false;
  return /^(togetherAI\/)/gi.test(s);
}

export function isOpenAIStr__W(s) {
  if (!s) return false;
  return /^openai/gi.test(s);
}

/**
 * This uses "Mbox" because it was originally conceived to handle just Mbox files.
 * Since that's changed, it now represents "Magic Box." Or that's what I tell myself
 * to justify leaving it here.
 */
self.addEventListener("message", workerMain);
