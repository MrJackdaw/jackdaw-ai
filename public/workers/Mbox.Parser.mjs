/** @file MBox Worker State and handlers */
import { startTimer, stopTimer, STATUS, workerError } from "./Mbox.Utils.mjs";
import { ERR_NO_FILE } from "./Mbox.Strings.mjs";
import { setActiveEmbedder } from "./Workers.ActiveEmbedder.mjs";
import {
  MboxWorkerStore,
  exportWorkerState,
  STATE__LOADING,
  exportWorkerAlert
} from "./Workers.State.mjs";
import {
  addToVectorStore,
  initializeVectorStore
} from "./Workers.VectorStore.mjs";

/**
 * @Action Read Inbox file and initialize VectorStore (async)
 * @param {File} file .mbox file to be read
 * @param {string} contentOwner Identifier of owner */
export async function parseFile(file) {
  if (!file) return workerError(ERR_NO_FILE);

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
  reader.onload = () =>
    readFileStream(new Blob([reader.result], { type: "text/plain" }));
  reader.onerror = () => {
    throw new Error(`${file.name} is unsupported`);
  };

  reader.readAsText(file);
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

/**
 * @LifeCycle Initialize or reset the worker
 * @param {object} opts
 * @param {string|undefined} opts.embedder
 * @param {string|undefined} opts.apiKey
 */
export async function initializeMboxWorker(opts) {
  const { embedder, apiKey } = opts;
  if (embedder) setActiveEmbedder(embedder, apiKey);

  startTimer("initializeVectorStore");
  await initializeVectorStore();
  stopTimer("initializeVectorStore");

  return exportWorkerState({ initialized: true });
}

/** @LifeCycle Clear inbox stuff */
export function resetMboxWorker() {
  if (!MboxWorkerStore.getState().initialized) return exportWorkerState();
  exportWorkerState(STATE__LOADING);
  initializeVectorStore();
}
