/** @file MBox Worker State and handlers */
import { startTimer, stopTimer, STATUS, workerError } from "./Mbox.Utils.mjs";
import { ERR_NO_FILE } from "./Mbox.Strings.mjs";
import { setActiveEmbedder } from "./Workers.ActiveEmbedder.mjs";
import {
  MboxWorkerStore,
  exportWorkerState,
  STATE__INIT,
  STATE__LOADING,
  exportWorkerAlert
} from "./Workers.State.mjs";
import {
  addToVectorStore,
  initializeVectorStore,
  setContentOwner
} from "./Workers.VectorStore.mjs";

/**
 * @Action Read Inbox file and initialize VectorStore (async)
 * @param {File} file .mbox file to be read
 * @param {string} contentOwner Identifier of owner */
export async function parseFile(file, contentOwner = "") {
  if (!file) return workerError(ERR_NO_FILE);
  setContentOwner(contentOwner);

  exportWorkerState(STATE__LOADING);

  // MBOX (plain text mailbox file with no file type) and normal plain-text files
  const fileName = file.name;
  if (/mbox$/.test(fileName) || file.type === "text/plain")
    return void parsePlainTextFile(file);

  if (file.type.startsWith("text/")) return void readTextFile__Other(file);

  // Everything else gets filtered
  switch (file.type) {
    // PDFs
    case "application/pdf": {
      return void parsePdfFile(file);
    }

    // TXTs
    default: {
      if (import.meta.env.DEV) console.log(file);
      return exportWorkerState(
        undefined,
        STATUS.ERROR,
        `${fileName} has an unsupported file type`
      );
    }
  }
}

/**
 * Read a file and assume it is a utf-8-encoded text file. Throw a fit if it isn't.
 * @param {File} file (Hopefully text) File to read
 */
function readTextFile__Other(file) {
  const reader = new FileReader();
  reader.onload = () => {
    console.log("yeah");
    console.log(reader.result);
  };
  reader.onerror = () => {
    throw new Error(`${file.name} is unsupported`);
  };

  reader.readAsText(file);

  // TODO stream text contents to document vector store
  new Blob().stream();
}

/**
 * @Action Read PDF file and initialize VectorStore (async)
 * @param {File} pdf .mbox file to be read */
export async function parsePdfFile(_pdf) {
  const err = "PDF files will be supported soon";
  exportWorkerAlert(err, "Error");
  exportWorkerState({ loading: false });
}

/**
 * @Action Read Inbox file and initialize VectorStore (async)
 * @param {File} file .mbox file to be read */
export async function parsePlainTextFile(file) {
  startTimer("initializeVectorStore");
  await initializeVectorStore();
  stopTimer("initializeVectorStore");

  startTimer("readFileStream");
  await readFileStream(file);
  stopTimer("readFileStream");
}

/**
 * @Action Read Inbox file and initialize VectorStore (async)
 * @param {File} file .mbox file to be read */
export async function readFileStream(file) {
  const reader = file.stream().getReader();

  return reader
    .read()
    .catch(() => workerError("Error opening file"))
    .then((x) => onFileStream(x, reader));
}

/**
 * File stream handler: adds `Documents` to the Vector store for each stream result
 * @param {ReadableStreamReadResult<Uint8Array>} streamResult
 * @param {boolean} streamResult.done
 * @param {Uint8Array|undefined} streamResult.value
 * @param {ReadableStreamDefaultReader<Uint8Array>} reader
 * @returns
 */
function onFileStream({ done, value }, reader) {
  if (done) return;
  const decoder = new TextDecoder();
  if (value) addToVectorStore(decoder.decode(value, { stream: true }));
  return reader.read().then((x) => onFileStream(x, reader));
}

/** @LifeCycle Initialize */
export function initializeMboxWorker(opts) {
  const { email: existing } = MboxWorkerStore.getState();
  const { owner: contentOwner = existing, embedder, apiKey } = opts;
  if (contentOwner) setContentOwner(contentOwner);
  if (embedder) setActiveEmbedder(embedder, apiKey);

  const initialized = Boolean(contentOwner);
  return exportWorkerState({ ...STATE__INIT, initialized });
}

/** @LifeCycle Clear inbox stuff */
export function resetMboxWorker() {
  if (!MboxWorkerStore.getState().initialized) return exportWorkerState();
  exportWorkerState(STATE__LOADING);
  initializeVectorStore();
}

/** Change owner email in state */
export function changeOwner(contentOwner = "") {
  setContentOwner(contentOwner);
  exportWorkerState();
}
