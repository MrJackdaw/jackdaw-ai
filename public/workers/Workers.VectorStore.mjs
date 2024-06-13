import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { pruneHTMLString, STATUS } from "./Workers.Utils.mjs";
import { getEmbedder } from "./Workers.ActiveEmbedder.mjs";
import { RES_VECTOR_SEARCH } from "./Workers.Strings.mjs";
import {
  exportWorkerAlert,
  exportWorkerState,
  MboxWorkerSettings
} from "./Workers.State.mjs";

/**
 * In-memory VectorStore instance
 * @type {import("langchain/vectorstores/memory").MemoryVectorStore} */
let MVectorStore;

/** @LifeCycle Initialize vector store (if not already done) */
export async function initializeVectorStore() {
  if (import.meta.env.DEV) console.log("\t ::initializeVectorStore");

  const embedder = await getEmbedder();
  // Exit immediately if using remote db for embedding and vector storage
  const { enableCloudStorage } = MboxWorkerSettings.getState();
  if (enableCloudStorage)
    return exportWorkerState(
      { loading: false, vectorStoreLoaded: true, messagesLoaded: true },
      STATUS.OK
    );

  MVectorStore = await MemoryVectorStore.fromDocuments([], embedder);
}

let docsCount = 0;
let errorMessage = "";
let documentName = "";

/** Set name of document to be vectorized (Track for metadata insertion) */
export function setVectorStoreDocumentContext(docName = "My Note") {
  documentName = docName;
}

/**
 * Initialize a `MemoryVectorStore` instance for `MailboxReader` from a single text blurb
 * @param {string|undefined} blurb
 * @param {string} [docName="My Note"] Progress percent (amount of file read so far) for UI alert */
export async function addToVectorStore(blurb, docName = "My Note") {
  setVectorStoreDocumentContext(docName);
  exportWorkerAlert(`Generating Embeddings for ${docName}...`, "Warning");
  const { enableCloudStorage } = MboxWorkerSettings.getState();
  if (!enableCloudStorage && !MVectorStore)
    return exportWorkerAlert(
      "VectorStore not ready: please check your Assistant Settings!",
      "Error"
    );

  // loadDocuments(documents, fragments, docName);
  await documentsFromTextBlurb(blurb).then(batchLoad);
}

/**
 * Send documents to vector storage online or locally (depending on user setting)
 * @param {import("@langchain/core/documents").Document[]} documents
 * @param {string} docName
 * @param {number} numFragments
 * @returns
 */
export async function loadDocuments(documents, numFragments, docName) {
  const { enableCloudStorage } = MboxWorkerSettings.getState();
  if (enableCloudStorage)
    return addDocumentsOnline(documents, docName).then(
      finishedAddingToVectorStore
    );

  // Local embedders are slow (unless a good model replacement is found). Amount of time
  // will scale horribly with file size.
  return MVectorStore.addDocuments(documents)
    .then(() => {
      docsCount = docsCount + numFragments;
      return true;
    })
    .catch((error) => {
      errorMessage = error?.message || "Error adding document to vector store";
      return false;
    })
    .finally(finishedAddingToVectorStore);
}

/** Helper: complete add-to-vectorStore operation */
function finishedAddingToVectorStore() {
  const { enableCloudStorage } = MboxWorkerSettings.getState();
  const status = errorMessage ? STATUS.ERROR : STATUS.OK;
  const alert =
    errorMessage || `Document ${enableCloudStorage ? "saved" : "loaded"}`;

  exportWorkerAlert(alert, errorMessage ? "Error" : "Info");
  exportWorkerState(
    {
      docsCount,
      loading: false,
      vectorStoreLoaded: true,
      messagesLoaded: docsCount > 0
    },
    status
  );

  docsCount = 0;
  errorMessage = "";
}

/**
 * Search for relevant content in vector store instance. Expects a query string.
 * @param {string} q Query string (e.g. user question) */
export async function searchVectors(q) {
  /**
   * Return vector store similarity results to UI, so it can be passed to an LLM or agent
   * @param {import("@langchain/core/documents").Document[]} data Search results
   */
  const handleVectorResponse = (data) => {
    self.postMessage({ status: STATUS.OK, message: RES_VECTOR_SEARCH, data });
  };

  const { enableCloudStorage, selectedProject } = MboxWorkerSettings.getState();
  if (enableCloudStorage) {
    if (!selectedProject) throw new Error("Project is required");
    return searchVectorsOnline(q, selectedProject).then(handleVectorResponse);
  }

  if (!MVectorStore) throw new Error("MVectorStore is not initialized");

  // Number of relevant results to return
  const k = 4;
  return (
    MVectorStore.maxMarginalRelevanceSearch
      ? MVectorStore.maxMarginalRelevanceSearch(q, { k })
      : MVectorStore.asRetriever({ k }).invoke(q)
  ).then(handleVectorResponse);
}

/**
 * Turns a text blurb into multiple Langchain `Document` objects with some owner metadata
 * @param {string} blurb Text blurb to be converted */
export function documentsFromTextBlurb(blurb) {
  const { owner, selectedProject: projectId } = MboxWorkerSettings.getState();
  const project_id = !projectId || projectId < 1 ? undefined : projectId;

  return splitTextBlurb(pruneHTMLString(blurb)).then((parts) => {
    /** @type {import("@langchain/core/documents").Document[]} Langchain `Documents` from email fragments */
    const documents = [];
    const fragments = 0;

    // Generate `Document` objects and send it aaaalllll back
    parts.forEach((pageContent) => {
      if (!pageContent) return;

      documents.push(
        new Document({
          pageContent,
          metadata: {
            id: documents.length + 1,
            owner,
            project_id
          }
        })
      );
    });

    return { documentName, documents, fragments };
  });
}

/**
 * Generates LangChain `Document` objects from an input string
 * @param {string} prunedString Plain text string without special characters */
async function splitTextBlurb(prunedString) {
  const fileSplitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: 0,
    chunkSize: 1000 // allow room for 8K context models
  });

  return fileSplitter.splitText(prunedString);
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const SUPABASE_URL = `${SERVER_URL}/data`;
const SESSION_URL = `${SERVER_URL}/session`;

/**
 * Match user query to relevant vector documents
 * @param {string} query User Search
 * @param {number|UUID} projectId
 * @returns
 */
async function searchVectorsOnline(query, projectId) {
  if (!projectId || projectId <= 0)
    return exportWorkerAlert(
      "Please select a Project for online document storage!",
      "Error"
    );

  const body = { action: "vector-search", data: { query, projectId } };
  return fetch(SUPABASE_URL, {
    method: "post",
    credentials: "include",
    body: JSON.stringify(body)
  })
    .then((res) => res.json())
    .then(checkSessionExpired)
    .then((v) => {
      if (!v) return null;
      // refetch data (if session was refreshed)
      if (v.email) return searchVectorsOnline(query, projectId);
      // Here, v = { message: string; data: Document[] }
      if (Array.isArray(v.data)) return v.data;
      return v;
    });
}

/**
 * Save one or more `Documents` to an online vector store
 * @param {string} docName Name of source document
 * @param {import("@langchain/core/documents").Document[]} documents Documents to save
 */
async function addDocumentsOnline(documents, docName) {
  const { selectedProject: projectId } = MboxWorkerSettings.getState();
  if (!projectId || projectId <= 0) {
    exportWorkerAlert(
      "Please select a Project for online document storage!",
      "Error"
    );
    return Promise.resolve(null);
  }

  if (!docName) {
    exportWorkerAlert("Document name is required!", "Error");
    return Promise.resolve(null);
  }

  const body = {
    action: "documents:upsert",
    data: { documentName: docName, documents, projectId }
  };
  return fetch(SUPABASE_URL, {
    method: "post",
    credentials: "include",
    body: JSON.stringify(body)
  })
    .then((res) => res.json())
    .then(checkSessionExpired)
    .then((v) => {
      // refetch data (depending on whether session was/wasn't refreshed)
      if (!v) return null;
      if (v.email) return addDocumentsOnline(documents, docName);
      return v;
    })
    .then((res) => {
      console.log("added docs online, got", res);
      return true;
    })
    .catch((err) => {
      console.log("could not add docs online, because", err);
      return false;
    });
}

/* 

  MORE (SERVER-)SUPPORTED DOCUMENT ACTIONS

'export type DataAction =
  | "documents:delete"
  | "documents:list"
  | "vector-search";

*/

let localRefreshFailed = false;
let refreshing = false;
async function refreshUserSession() {
  if (localRefreshFailed || refreshing) return null;
  refreshing = true;

  try {
    const { user } = await fetch(SESSION_URL, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ action: "session:refresh" })
    });
    // if (user) cacheUserSetting(SETTING__USER_KEY, JSON.stringify(user));
    refreshing = false;
    return user;
  } catch (error) {
    localRefreshFailed = true;
    return null;
  }
}

/**
 * @type {T extends { message: string } & Record<string, any>}
 * @description Check if session expired based on response from server
 * @param {T} v Response from server
 */
function checkSessionExpired(v) {
  if (v.message === "Session Expired") return refreshUserSession();
  return v;
}

const queue = [];
let inflight = false;

/**
 * Save documents to server in batches to prevent failures
 * @param {Object} opts
 * @param {import("@langchain/core/documents").Document[]} opts.documents
 * @param {number} opts.fragments
 * @param {string} opts.documentName */
export async function batchLoad({ documents, fragments, documentName }) {
  if (inflight) {
    return queue.push({ documents, fragments, documentName });
  } else inflight = true;

  const BATCH_SIZE = 40; // how many documents to upload at a time
  const expectBatches = Math.ceil(documents.length / BATCH_SIZE);
  let dox = [...documents];
  let currentBatch = 0;
  const doLoad = async () => {
    currentBatch += 1;

    // Alert user
    exportWorkerAlert(
      `Batch-loading ${documentName} (${currentBatch} of ${expectBatches}) ...`,
      "Warning"
    );

    // Load documents to db or memory
    await loadDocuments(dox.slice(0, BATCH_SIZE), fragments, documentName);

    // Move cursor forward (remove the uploaded items) and
    // continue if there are still files
    dox = dox.slice(BATCH_SIZE);
    if (dox.length) return doLoad();

    inflight = false;
    if (queue.length) batchLoad(queue.shift());
  };

  doLoad();
}
