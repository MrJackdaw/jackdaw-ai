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

let pctOfFileRead = 0;
let fileSize = 0;
let fileName = "";
const plainTextToBlob = (s) => new Blob([s], { type: "text/plain" });

/**
 * @Action Read Inbox file and initialize VectorStore (async)
 * @param {File} file .mbox file to be read
 * @param {string} contentOwner Identifier of owner */
export async function parseFile(file) {
  if (!file) return workerError(ERR_NO_FILE);

  exportWorkerState(STATE__LOADING);
  fileName = file.name;
  fileSize = file.size;
  pctOfFileRead = 0;

  // MBOX (plain text mailbox file with no file type) and normal plain-text files
  const canParseAsText = ["text/plain", "text/rtf", "application/json"];
  const readAsText =
    /mbox$/.test(fileName) || canParseAsText.includes(file.type);
  if (readAsText) return void parsePlainTextFile(file);

  // Everything else gets filtered
  switch (file.type) {
    // Office file-types get sent to a Lambda. Might funnel to Textract if it makes sense.
    case `application/vnd.openxmlformats-officedocument.wordprocessingml.document`: // (DOCX)
    case `application/vnd.ms-excel`: // (XLS)
    case `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`: // (XLSX)
    case `application/vnd.openxmlformats-officedocument.presentationml.presentation`: // (PPTX)
    case `text/csv`: // (CSV)
    case "application/pdf": {
      return void extractFileTextAWS(file);
    }

    default: {
      if (import.meta.env.DEV) console.log(file);
      const err = `${fileName} is an unsupported file`;
      return exportWorkerState(undefined, STATUS.ERROR, err);
    }
  }
}

/**
 * Send a file to the server for text extraction (no embedding or preserving)
 * @param {File} file
 */
function extractFileTextAWS(file) {
  const MEGABYTE = 1024 * 1024;
  const MAX_FILE_SIZE_BYTES = 4 * MEGABYTE;

  // Warn user if file is too large (anything over 4-ish MB will cause AWS to shit.)
  if (file.size >= MAX_FILE_SIZE_BYTES) {
    exportWorkerAlert(
      "File is too large! (4MB+ must be uploaded first).",
      "Error"
    );
    return exportWorkerState({ loading: false });
  }

  let url = import.meta.env.VITE_SERVER_URL;
  url = `${url}/extract-text`;

  const formData = new FormData();
  formData.append("file", file);

  // Send file to server for text-extraction
  fetch(url, {
    method: "post",
    credentials: "include",
    body: formData
  })
    .then((d) => d.json())
    .then(({ data }) => readFileStream(plainTextToBlob(data.text)))
    .catch((e) => {
      console.log({ e });
      workerError("Error opening file " + fileName);
    });
}

/**
 * Read a file and assume it is a utf-8-encoded text file. Throw a fit if it isn't.
 * @param {File} file (Hopefully text) File to read
 */
function parsePlainTextFile(file) {
  const reader = new FileReader();
  reader.onload = () => readFileStream(plainTextToBlob(reader.result));
  reader.onerror = () => {
    throw new Error(`${file.name} is unsupported`);
  };

  reader.readAsText(file);
}

/**
 * @Action Read Inbox file and initialize VectorStore (async)
 * @param {File} file .mbox file to be read */
export async function readFileStream(file) {
  startTimer("readFileStream");
  const reader = file.stream().getReader();

  return reader
    .read()
    .catch(() => workerError("Error opening file"))
    .then((x) => onFileStream(x, reader));

  /**
   * File stream handler: adds `Documents` to the Vector store for each stream result
   * @param {ReadableStreamReadResult<Uint8Array>} streamResult
   * @param {boolean} streamResult.done
   * @param {Uint8Array|undefined} streamResult.value
   * @param {ReadableStreamDefaultReader<Uint8Array>} reader
   * @returns
   */
  function onFileStream({ done, value }, reader) {
    if (done) return void stopTimer("readFileStream");

    // Report file opening progress
    pctOfFileRead = pctOfFileRead + value.length;
    const progress = Math.ceil((pctOfFileRead / fileSize) * 100);
    exportWorkerAlert(`Reading file: (${progress}%)`, "Warning");

    if (value) {
      const decoder = new TextDecoder();
      addToVectorStore(decoder.decode(value, { stream: true }), fileName);
    }

    return reader.read().then((x) => onFileStream(x, reader));
  }
}

/**
 * @LifeCycle Initialize or reset the worker
 * @param {object} opts
 * @param {string|undefined} opts.embedder
 * @param {string|undefined} opts.apiKey
 */
export async function initializeMboxWorker(opts) {
  const { embedder, apiKey } = opts;
  if (embedder) await setActiveEmbedder(embedder, apiKey);

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
