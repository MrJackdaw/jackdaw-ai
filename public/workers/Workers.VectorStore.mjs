import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { pruneHTMLString, STATUS } from "./Mbox.Utils.mjs";
import { getEmbedder } from "./Workers.ActiveEmbedder.mjs";
import { RES_VECTOR_SEARCH } from "./Mbox.Strings.mjs";
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

/**
 * Initialize a `MemoryVectorStore` instance for `MailboxReader` from a single text blurb
 * @param {string|undefined} blurb
 * @param {string} [docName="My Note"] Progress percent (amount of file read so far) for UI alert */
export async function addToVectorStore(blurb, docName = "My Note") {
  const { documents, fragments } = await documentsFromTextBlurb(blurb);
  const { enableCloudStorage } = MboxWorkerSettings.getState();

  // Track current document name for metadata insertion
  documentName = docName;
  exportWorkerAlert(`Generating Embeddings for ${docName}...`, "Warning");

  // Local embedders are slow (unless a good model replacement is found). Amount of time
  // will scale horribly with file size.

  return Promise.resolve(
    enableCloudStorage
      ? addDocumentsOnline(documents)
      : MVectorStore.addDocuments(documents)
  )
    .then(() => {
      docsCount = docsCount + fragments;
      return true;
    })
    .catch((error) => {
      errorMessage = error?.message || "Error adding document to vector store";
      return false;
    })
    .finally(() => {
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
    });
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

  return (
    MVectorStore.maxMarginalRelevanceSearch
      ? MVectorStore.maxMarginalRelevanceSearch(q, { k: 2 })
      : MVectorStore.asRetriever({ k: 2 }).invoke(q)
  ).then(handleVectorResponse);
}

/**
 * Turns a text blurb into multiple Langchain `Document` objects with some owner metadata
 * @param {string} blurb Text blurb to be converted */
function documentsFromTextBlurb(blurb) {
  const { owner, selectedProject: projectId } = MboxWorkerSettings.getState();
  const project_id = !projectId || projectId < 1 ? undefined : projectId;

  return splitTextBlurb(pruneHTMLString(blurb)).then((parts) => {
    /** @type {Document[]} Langchain `Documents` from email fragments */
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
            project_id,
            documentName
          }
        })
      );
    });

    return { documents, fragments };
  });
}

/**
 * Generates LangChain `Document` objects from an input string
 * @param {string} prunedString Plain text string without special characters */
async function splitTextBlurb(prunedString) {
  const fileSplitter = new RecursiveCharacterTextSplitter({
    // separators: ["From ", "From: "],
    chunkOverlap: 100,
    chunkSize: 1000
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
 * @param {import("@langchain/core/documents").Document[]} documents Documents to save
 */
async function addDocumentsOnline(documents) {
  const { selectedProject: projectId } = MboxWorkerSettings.getState();
  if (!projectId || projectId <= 0)
    return exportWorkerAlert(
      "Please select a Project for online document storage!",
      "Error"
    );

  const body = { action: "documents:upsert", data: { documents, projectId } };
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
      if (v.email) return addDocumentsOnline(documents);
      return v;
    })
    .then((res) => {
      console.log("added docs online, got", res);
    })
    .catch((err) => {
      console.log("could not add docs online, because", err);
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
export function checkSessionExpired(v) {
  if (v.message === "Session Expired") return refreshUserSession();
  return v;
}
