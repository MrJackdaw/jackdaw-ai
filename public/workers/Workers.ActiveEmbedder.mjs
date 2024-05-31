import { HFEmbedder, JackComEmbedder, OpenAIEmbedder } from "./Workers.Models";
import { MboxWorkerSettings } from "./Workers.State.mjs";

/** @type {AsyncSingleton} Active embedding (user can conditionally override) */
let activeEmbedder = null;
/**
 * Get active embeddings model (allows user to override with
 * huggingface (local), personal open-ai, or proxy-openai (jackcom))
 * @returns {Promise<AsyncSingleton>} */
export async function getEmbedder() {
  return activeEmbedder || setActiveEmbedder("huggingface");
}

/**
 * Override active embedder class (user can conditionally override)
 * @param {"@jackcom/openai"|"huggingface"|"openai"} e New Embedder target
 * @param {string?} apiKey  */

export async function setActiveEmbedder(e, apiKey = "") {
  // Update shared worker settings state
  MboxWorkerSettings.multiple({ embedder: e, embedderAPIKey: apiKey });

  switch (e) {
    case "@jackcom/openai": {
      activeEmbedder = await JackComEmbedder.getInstance();
      break;
    }
    case "huggingface": {
      activeEmbedder = await HFEmbedder.getInstance();
      break;
    }
    case "openai": {
      // requires user to provide their own API key
      if (!apiKey) return console.error("API key required");
      activeEmbedder = await OpenAIEmbedder.getInstance(apiKey);
      break;
    }

    default:
      console.error("Invalid embedder");
      break;
  }

  return activeEmbedder;
}
