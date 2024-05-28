import { Document } from "@langchain/core/documents";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { LS_OLLAMA_BASEURL, LS_ASSISTANT_KEY } from "utils/strings";
import { AISource } from "utils/general";
import { SettingsStore } from "state/settings-store";

const OPENAI_4T = "gpt-4-turbo-2024-04-09";
const OPENAI_4o = "gpt-4o";
const OPENAI_3_5T = "gpt-3.5-turbo-0125";
const OPENAI_EMB_AI = "text-embedding-3-large";
export const MODEL_NAMES = {
  [OPENAI_4T]: "OpenAI GPT-4 Turbo",
  [OPENAI_4o]: "OpenAI GPT-4o",
  [OPENAI_3_5T]: "OpenAI GPT-3.5T",
  [OPENAI_EMB_AI]: "OpenAI Text Embedding 3 (Large)"
};

/** @Helper `ChatOpenAI` instance with variable model */
const openAIInstance = (model: string, verbose = false) => {
  const apiKey = SettingsStore.getState().assistantAPIKey;
  return new ChatOpenAI({ apiKey, model, verbose });
};

/** @Model `ChatOpenAI` instance with `gpt-3.5-turbo` */
export const openAI3_5T = () => openAIInstance(OPENAI_3_5T);

/** @Model `ChatOpenAI` instance with `gpt-4o` (newest) */
export const openAI4T = () => openAIInstance(OPENAI_4T);

/** @Model `ChatOpenAI` instance with `gpt-4o` (newest) */
export const openAI4o = () => openAIInstance(OPENAI_4o);

/** @Model `ChatOllama` instance (expects url to `llama` LLM) */
export const ollama = () => {
  // TODO: TEST this when possible
  const model = new ChatOllama({
    verbose: import.meta.env.DEV,
    baseUrl: localStorage.getItem(LS_OLLAMA_BASEURL) ?? undefined
  });
  return model;
};

export type AssistantInvokeParams = {
  input: string;
  context: Document[];
  owner: string;
};

export const openAIEmbedder = () => {
  const { embedderAPIKey: apiKey } = SettingsStore.getState();
  const model = new OpenAIEmbeddings({
    apiKey,
    model: OPENAI_EMB_AI,
    verbose: import.meta.env.DEV
  });
  return model;
};

const LLMs = { openAI3_5T, openAI4T, openAI4o, ollama };
const allModels = Object.keys(LLMs);

export const llmsForAISource = (src?: AISource) => {
  switch (src) {
    case "huggingface":
      return ["ollama", "huggingface"];
    case "openai":
      return allModels.filter((v) => v !== "ollama");
    default:
      return [...allModels, "huggingface"];
  }
};

export function getActiveLLM() {
  const assistant = localStorage.getItem(LS_ASSISTANT_KEY);
  return LLMs[assistant as keyof typeof LLMs]();
}
