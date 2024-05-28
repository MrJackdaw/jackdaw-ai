/** @file MBox Worker State and handlers */
import { startTimer, stopTimer, STATUS, workerError } from "./Mbox.Utils.mjs";
import { ERR_NO_FILE } from "./Mbox.Strings.mjs";
import { setActiveEmbedder } from "./Workers.ActiveEmbedder.mjs";
import {
  MboxWorkerStore,
  exportWorkerState__,
  STATE__INIT,
  STATE__LOADING
} from "./Workers.State.mjs";
import {
  addToVectorStore__,
  initializeVectorStore__,
  setContentOwner
} from "./Workers.VectorStore.mjs";

/**
 * @Action Read Inbox file and initialize VectorStore (async)
 * @param {File} file .mbox file to be read
 * @param {string} contentOwner Identifier of owner */
export async function parseFile(file, contentOwner = "") {
  if (!file) return workerError(ERR_NO_FILE);
  setContentOwner(contentOwner);

  MboxWorkerStore.multiple(STATE__LOADING);
  exportWorkerState__();

  // MBOX (these don't have a file type)
  if (/mbox$/.test(file.name)) return void parseMBoxFile(file);

  switch (file.type) {
    // PDFs
    case "application/pdf": {
      return void parsePdfFile(file);
    }

    // case
    default: {
      console.log(file.type);
      return exportWorkerState__(STATUS.ERROR, "Unsupported file type");
    }
  }
}

/**
 * @Action Read PDF file and initialize VectorStore (async)
 * @param {File} pdf .mbox file to be read */
export async function parsePdfFile(_pdf) {
  const err = "PDF files will be supported soon";
  MboxWorkerStore.multiple({ loading: false });
  exportWorkerState__(STATUS.ERROR, err);
}

/**
 * @Action Read Inbox file and initialize VectorStore (async)
 * @param {File} file .mbox file to be read */
export async function parseMBoxFile(file) {
  startTimer("initializeVectorStore");
  await initializeVectorStore__();
  stopTimer("initializeVectorStore");

  startTimer("readFileStream");
  await readFileStream(file);
  stopTimer("readFileStream");
}

/**
 * @Action Read Inbox file and initialize VectorStore (async)
 * @param {File} file .mbox file to be read */
export async function readFileStream(file) {
  const decoder = new TextDecoder();
  const reader = file.stream().getReader();

  return reader
    .read()
    .catch(() => workerError("Error opening file"))
    .then(onFileStream);

  /**
   * File stream handler
   * @param {ReadableStreamReadResult<Uint8Array>} streamResult
   * @param {boolean} streamResult.done
   * @param {Uint8Array|undefined} streamResult.value
   * @returns
   */
  function onFileStream({ done, value }) {
    if (done) return;
    if (value) addToVectorStore__(decoder.decode(value, { stream: true }));
    return reader.read().then(onFileStream);
  }
}

/** @LifeCycle Initialize */
export function initializeMboxWorker(opts) {
  const { email: existing } = MboxWorkerStore.getState();
  const { owner: contentOwner = existing, embedder, apiKey } = opts;
  if (contentOwner) setContentOwner(contentOwner);
  if (embedder) setActiveEmbedder(embedder, apiKey);

  const initialized = Boolean(contentOwner);
  MboxWorkerStore.multiple({ ...STATE__INIT, initialized });
  return exportWorkerState__();
}

/** @LifeCycle Clear inbox stuff */
export function resetMboxWorker() {
  if (!MboxWorkerStore.getState().initialized) return exportWorkerState__();

  MboxWorkerStore.multiple(STATE__LOADING);
  exportWorkerState__();

  initializeVectorStore__().then(() => {
    MboxWorkerStore.multiple({ loading: false, vectorStoreLoaded: true });
    exportWorkerState__();
  });
}

/** Change owner email in state */
export function changeOwner(contentOwner = "") {
  setContentOwner(contentOwner);
  exportWorkerState__();
}
