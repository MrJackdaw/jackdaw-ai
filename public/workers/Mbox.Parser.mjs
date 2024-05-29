import { STATUS, clearCachedModels, workerError } from "./Mbox.Utils.mjs";
import { ERR_NO_ACTION, ERR_NO_DATA } from "./Mbox.Strings.mjs";
import {
  initializeMboxWorker,
  changeOwner,
  resetMboxWorker,
  parseFile
} from "./Mbox.Handlers.mjs";
import { setActiveEmbedder } from "./Workers.ActiveEmbedder.mjs";
import { MboxWorkerStore } from "./Workers.State.mjs";
import { searchVectors } from "./Workers.VectorStore.mjs";

self.addEventListener(
  "message",
  (
    /** @type {MessageEvent<{action: string; data: Record<string, any>}>} */
    event
  ) => {
    const { action, data } = event.data;

    switch (action) {
      case "Mbox.initialize": {
        // Post a message whenever the worker state changes
        attachParserToUI();
        // Prepare worker for ingesting data
        return initializeMboxWorker(data);
      }

      // Clear cached values
      case "Mbox.clearCache": {
        return clearCachedModels();
      }

      // Load an mbox file
      case "Mbox.parseFile": {
        return data
          ? parseFile(data.file, data.owner)
          : workerError(ERR_NO_DATA);
      }

      // Find relevant vectors: Expects a query string at `e.data.data`
      case "Mbox.searchVectors": {
        return data.query
          ? searchVectors(data.query)
          : workerError(ERR_NO_DATA);
      }

      case "Mbox.clearEmails": {
        return resetMboxWorker();
      }

      case "Mbox.changeOwner": {
        return changeOwner(data.owner ?? "");
      }

      case "Mbox.changeEmbedder": {
        return data
          ? setActiveEmbedder(data.embedder, data.apiKey)
          : workerError(ERR_NO_DATA);
      }

      default: {
        return workerError(ERR_NO_ACTION, action);
      }
    }
  }
);

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
      message: "Mbox.State::Update"
    })
  );
}
