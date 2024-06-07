import { Document } from "@langchain/core/documents";
import { ChatOpenAI } from "@langchain/openai";
import { TogetherAI } from "@langchain/community/llms/togetherai";
import { LS_ASSISTANT_KEY } from "utils/strings";
import { AISource, JackComAIModel } from "utils/general";
import { SettingsStore } from "state/settings-store";
import { UserStore } from "state/user";
import ChatJackCOM, { ChatJackCOMArgs } from "./Models.JackCom";

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
const openAI = (model: string, verbose = false) => {
  const { aiProviderAPIKey: apiKey } = SettingsStore.getState();
  return new ChatOpenAI({ apiKey, model, streaming: true, verbose });
};

/** @Helper `TogetherAI` instance with variable model */
const togetherAI = (model: string, verbose = false) => {
  const { aiProviderAPIKey: apiKey } = SettingsStore.getState();
  return new TogetherAI({ apiKey, model, streaming: true, verbose });
};

export type JInvokeAssistantParams = {
  input: string;
  context: Document[];
  owner: string;
};

export const jackComAI = (
  model: ChatJackCOMArgs["model"] = "@jackcom/openai-3"
) => new ChatJackCOM({ model });

const openAI3_5T = () => openAI(OPENAI_3_5T);
const openAI4T = () => openAI(OPENAI_4T);
const openAI4o = () => openAI(OPENAI_4o);

// All supported LLMs
export const LLMs = {
  // Jackcom + OpenAI (no user API key)
  "@jackcom/openai-3": () => jackComAI("@jackcom/openai-3"),
  "@jackcom/openai-4T": () => jackComAI("@jackcom/openai-4T"),
  "@jackcom/openai-4o": () => jackComAI("@jackcom/openai-4o"),

  // TogetherAI (requires user API key)
  "@togetherAI/mistral-7B": () =>
    togetherAI("mistralai/Mistral-7B-Instruct-v0.3"),
  "@togetherAI/llama3-8B": () => togetherAI("meta-llama/Llama-3-8b-chat-hf"),
  "@togetherAI/code-llama3-7Bi": () =>
    togetherAI("codellama/CodeLlama-7b-Instruct-hf"),
  "@togetherAI/striped-hyena-7B": () =>
    togetherAI("togethercomputer/StripedHyena-Nous-7B"),

  // OpenAI (requires user API key)
  openAI3_5T,
  openAI4T,
  openAI4o
};

export const llmsForAISource = (src?: AISource) => {
  if (src === "huggingface") return ["huggingface"];
  const all = [...Object.keys(LLMs), "huggingface"];
  const { authenticated } = UserStore.getState();
  return authenticated ? all : all.filter((k) => !k.startsWith("@jackcom"));
};

export function getActiveChatLLM() {
  const assistant = localStorage.getItem(LS_ASSISTANT_KEY);

  if (assistant?.startsWith("@jackcom/"))
    return jackComAI(assistant as JackComAIModel);

  if (assistant?.startsWith("@togetherAI/"))
    return LLMs[assistant as keyof typeof LLMs]();
  
  return openAI3_5T();
}
