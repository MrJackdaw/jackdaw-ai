import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { pruneHTMLString, STATUS } from "./Mbox.Utils.mjs";
import { getEmbedder } from "./Workers.ActiveEmbedder.mjs";
import { RES_VECTOR_SEARCH } from "./Mbox.Strings.mjs";
import { exportWorkerAlert, exportWorkerState, MboxWorkerSettings } from "./Workers.State.mjs";

/**
 * In-memory VectorStore instance
 * @type {import("langchain/vectorstores/memory").MemoryVectorStore} */
let MVectorStore;
let owner = "";
let useCloudStorage = false;

/**
 * Set owner to be appended to documents
 * @param {string} newOwner New owner
 */
export function setContentOwner(newOwner = "", enableCloudStorage = false) {
  console.log('::Worker.VectorStore::', MboxWorkerSettings.getState())
  owner = newOwner;
  useCloudStorage = enableCloudStorage;
}

/** @LifeCycle Initialize vector store (if not already done) */
export async function initializeVectorStore(contentOwner = "") {
  if (import.meta.env.DEV) console.log("\t ::initializeVectorStore");

  owner = contentOwner;

  return getEmbedder()
    .then((embedder) => MemoryVectorStore.fromDocuments([], embedder))
    .then((mvstoreInstance) => void (MVectorStore = mvstoreInstance));
}

let docsCount = 0;
let errorMessage = "";

/**
 * Initialize a `MemoryVectorStore` instance for `MailboxReader` from a single text blurb
 * @param {string|undefined} blurb
 * @param {boolean} [done=false] When true, just notify the UI that work is completed */
export async function addToVectorStore(blurb, done = false) {
  if (done) return;

  const { documents, emailFragments } = await documentsFromTextBlurb(blurb);

  if (useCloudStorage)
    exportWorkerAlert(
      `Documents are TOOOOTALLY being stored online.`,
      "Warning"
    );

  // THIS TAKES A LONG TIME WHEN the embedder is running locally. Amount of time
  // will scale horribly with file size.
  return MVectorStore.addDocuments(documents)
    .then(() => {
      docsCount = docsCount + emailFragments.length;

      return true;
    })
    .catch((error) => {
      errorMessage = error || "Error adding document to vector store";
      return false;
    })
    .finally(() => {
      const status = errorMessage ? STATUS.ERROR : STATUS.OK;
      const alert =
        errorMessage || `Document ${useCloudStorage ? "saved" : "loaded"}`;
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
    });
}

/**
 * Turns a text blurb into multiple Langchain `Document` objects with some owner metadata
 * @param {string} blurb Text blurb to be converted */
function documentsFromTextBlurb(blurb) {
  return splitTextBlurb(pruneHTMLString(blurb)).then((parts) => {
    /** @type {string[]} Optimistically separated email fragments */
    const emailFragments = [];
    /** @type {Document[]} Langchain `Documents` from email fragments */
    const documents = [];

    // Generate `Document` objects and send it aaaalllll back
    parts.forEach((pageContent) => {
      if (!pageContent) return;

      const metadata = { id: emailFragments.length + 1, owner };
      emailFragments.push(pageContent);
      documents.push(new Document({ pageContent, metadata }));
    });

    return { documents, emailFragments };
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

/**
 * Search for relevant content in vector store instance. Expects a query string.
 * @param {string} q Query string (e.g. user question) */
export async function searchVectors(q) {
  if (!MVectorStore) throw new Error("MVectorStore is not initialized");

  return (
    MVectorStore.maxMarginalRelevanceSearch
      ? MVectorStore.maxMarginalRelevanceSearch(q, { k: 2 })
      : MVectorStore.asRetriever({ k: 2 }).invoke(q)
  ).then((docs) =>
    self.postMessage({
      status: STATUS.OK,
      message: RES_VECTOR_SEARCH,
      data: docs
    })
  );
}
