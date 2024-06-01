import { Document } from "@langchain/core/documents";
import { ChatOpenAI } from "@langchain/openai";
import { LS_ASSISTANT_KEY } from "utils/strings";
import { AISource } from "utils/general";
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
const openAIInstance = (model: string, verbose = false) => {
  const apiKey = SettingsStore.getState().assistantAPIKey;
  return new ChatOpenAI({ apiKey, model, verbose });
};

export type JInvokeAssistantParams = {
  input: string;
  context: Document[];
  owner: string;
};

export const jackComOpenAI = (
  model: ChatJackCOMArgs["model"] = "@jackcom/openai"
) => new ChatJackCOM({ model });

const openAI3_5T = () => openAIInstance(OPENAI_3_5T);
const openAI4T = () => openAIInstance(OPENAI_4T);
const openAI4o = () => openAIInstance(OPENAI_4o);
const LLMs = {
  openAI3_5T,
  openAI4T,
  openAI4o,
  "@jackcom/openai": () => jackComOpenAI("@jackcom/openai"),
  "@jackcom/togetherai": () => jackComOpenAI("@jackcom/togetherai")
};

export const llmsForAISource = (src?: AISource) => {
  if (src === "huggingface") return ["huggingface"];
  const all = [...Object.keys(LLMs), "huggingface"];
  const { authenticated } = UserStore.getState();
  return authenticated ? all : all.filter((k) => !k.startsWith("@jackcom"));
};

export function getActiveChatLLM() {
  const assistant = localStorage.getItem(LS_ASSISTANT_KEY);
  return LLMs[assistant as keyof typeof LLMs]();
}
