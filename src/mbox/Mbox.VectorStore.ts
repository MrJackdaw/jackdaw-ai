import { Document } from "@langchain/core/documents";
import { RES_VECTOR_SEARCH } from "../utils/strings";
import { DocumentHandler, sendParserMessage } from "./Mbox";

/**
 * Search for relevant content in vector store instance
 * @param query User's search query 
 * @returns List of matching Langchain `Documents` */
export async function findRelevantVectors(query: string): Promise<Document[]> {
  return new Promise((resolve) => {
    // When the Web worker responds, resolve this Promise
    const onVectors = (e: MessageEvent<any>) => {
      if (e.data.message !== RES_VECTOR_SEARCH) return;
      DocumentHandler.removeEventListener("message", onVectors);
      resolve(e.data.data ?? []);
    };

    // Listen until the Web Worker emits the event we want
    DocumentHandler.addEventListener("message", onVectors);

    // Disconnect from the Web Worker when the page closes
    window.addEventListener("beforeunload", () => {
      DocumentHandler.removeEventListener("message", onVectors);
    });

    // Send a message to the Web Worker
    sendParserMessage("Worker.searchVectors", { query });
  });
}
