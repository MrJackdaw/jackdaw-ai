import { STATUS, clearCachedModels, workerError } from "./Mbox.Utils.mjs";
import { ERR_NO_ACTION, ERR_NO_DATA } from "./Mbox.Strings.mjs";
import {
  initializeMboxWorker,
  changeOwner,
  resetMboxWorker,
  parseFile
} from "./Mbox.Parser.mjs";
import { setActiveEmbedder } from "./Workers.ActiveEmbedder.mjs";
import { MboxWorkerSettings, MboxWorkerStore } from "./Workers.State.mjs";
import { searchVectors } from "./Workers.VectorStore.mjs";

/**
 * This uses "Mbox" because it was originally conceived to handle just Mbox files.
 * Since that's changed, it now represents "Magic Box." Or that's what I tell myself
 * to justify leaving it here.
 */
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
          ? parseFile(data.file, data.owner, data.enableCloudStorage)
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
        return changeOwner(data.owner ?? "", data.enableCloudStorage);
      }

      case "Mbox.changeEmbedder": {
        return data
          ? setActiveEmbedder(data.embedder, data.apiKey)
          : workerError(ERR_NO_DATA);
      }

      case "Mbox.updateSettings": {
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
