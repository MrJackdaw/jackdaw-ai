/** @file MBox Worker State and handlers */
import {
  startTimer,
  stopTimer,
  STATUS,
  workerError,
  csvToJson,
  plainTextToBlob
} from "./Workers.Utils.mjs";
import { ERR_NO_FILE } from "./Workers.Strings.mjs";
import { setActiveEmbedder } from "./Workers.ActiveEmbedder.mjs";
import {
  exportWorkerState,
  exportWorkerAlert,
  MboxWorkerStore,
  STATE__LOADING
} from "./Workers.State.mjs";
import {
  addToVectorStore,
  initializeVectorStore
} from "./Workers.VectorStore.mjs";
import PostalMime from "postal-mime";

let pctOfFileRead = 0;
let fileSize = 0;
let fileName = "";

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

  // Intercept proprietary MSWord docs
  if (file.type === "application/msword") {
    return exportWorkerAlert(
      "MS Word document detected: please convert to a .docx file first",
      "Error"
    );
  }

  // MBOX (plain text mailbox file with no file type)
  if (/^mbox$|\.mbox$/.test(fileName)) return parseMBoxFile(file);

  // normal plain-text files
  const canParseAsText = ["text/plain", "text/rtf", "application/json"];
  const readAsText =
    canParseAsText.includes(file.type) || /(\.md$)/.test(fileName);
  if (readAsText) return void parsePlainTextFile(file);

  // Everything else gets filtered
  switch (file.type) {
    case `text/csv`: // (CSV)
      return batchConvertCSVToJSON(file);
    // Office file-types get sent to a Lambda. Might funnel to Textract if it makes sense.
    case `application/vnd.openxmlformats-officedocument.wordprocessingml.document`: // (DOCX)
    case `application/vnd.ms-excel`: // (XLS)
    case `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`: // (XLSX)
    case `application/vnd.openxmlformats-officedocument.presentationml.presentation`: // (PPTX)
    case "application/pdf": {
      return void extractDocumentTextAWS(file);
    }

    default: {
      if (import.meta.env.DEV) console.log(file);
      const err = `${fileName} is an unsupported file`;
      return exportWorkerState(undefined, STATUS.ERROR, err);
    }
  }
}

/**
 * Extract text content from Mbox file
 * @param {File} file Mbox file target
 */
async function parseMBoxFile(file) {
  console.log("parsing mbox");
  PostalMime.parse(file).then(({ text }) => {
    // console.log(text);
    if (text.length) readFileStream(plainTextToBlob(text));
  });
}

/**
 * Send a file to the server for text extraction (no embedding or preserving)
 * @param {File} file
 */
function extractDocumentTextAWS(file) {
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

  const formData = new FormData();
  formData.append("file", file);

  // Send file to server for text-extraction
  let url = import.meta.env.VITE_SERVER_URL;
  url = `${url}/extract-text`;
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
 * Takes a CSV file, breaks it up into batches of rows, then attempts to create embeddings
 * for each set of rows.
 * @param {File} file CSV file (type `text/csv`)
 */
async function batchConvertCSVToJSON(file) {
  const [getRows, error] = await csvToJson(file);
  if (error) {
    exportWorkerAlert("CSV File could not be opened", "Error");
    return exportWorkerState({ loading: false });
  }

  exportWorkerAlert(
    "Batch-exporting CSV rows: do not refresh the page",
    "Info",
    true
  );
  const result = getRows(); // generator function
  let i = result.next();
  /* Here, we'll stringify and vectorize the CSV rows */
  const batchEmbedCSVRows = async () => {
    if (i.done) return;

    if (i.value) {
      // i.value is an array of up to 300 rows. Adjust array length by
      // passing a second parameter to the CSVtoJSON( file, batchSize ) fn.
      const batch = JSON.stringify(i.value);
      await readFileStream(plainTextToBlob(batch));
    }

    // Move iterable marker to next result
    i = result.next();

    // Debounce with set-timeout in development (otherwise local Lambda fails)
    if (import.meta.env.DEV) {
      const lambdaDelay = import.meta.env.VITE_DEBOUNCE_LAMBDA_MS ?? 1200;
      setTimeout(batchEmbedCSVRows, lambdaDelay);
    } else batchEmbedCSVRows();
  };

  batchEmbedCSVRows();
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
export async function initializeWorker(opts) {
  const { embedder, apiKey } = opts;
  if (embedder) await setActiveEmbedder(embedder, apiKey);

  startTimer("initializeVectorStore");
  await initializeVectorStore();
  stopTimer("initializeVectorStore");

  return exportWorkerState({ initialized: true });
}

/** @LifeCycle Clear inbox stuff */
export function resetWorker() {
  if (!MboxWorkerStore.getState().initialized) return exportWorkerState();
  exportWorkerState(STATE__LOADING);
  initializeVectorStore();
}
