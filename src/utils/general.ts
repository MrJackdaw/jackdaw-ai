import { FormEventHandler } from "react";
import {
  LS_EMBEDDER_KEY,
  LS_ASSISTANT_KEY,
  LS_AI_PROVIDER_APIKEY,
  LS_USE_CLOUD_STORE,
  LS_COLOR_IDENT_OVERRIDE,
  LS_OWNER_KEY,
  LS_ACTIVE_PROJECT
} from "./strings";

export const SERVER_URL = import.meta.env.VITE_SERVER_URL;
export const SESSION_URL = `${SERVER_URL}/session`;
export const SUPABASE_URL = `${SERVER_URL}/data`;
export const JACKCOM_AI_URL = `${SERVER_URL}/jackcom-ai`;
export const AUTH_OPTS: RequestInit = {
  credentials: "include",
  method: "post"
};
export type JackComAIModel =
  | "@jackcom/openai-3"
  | "@jackcom/openai-4T"
  | "@jackcom/openai-4o";
export type TogetherAIModel =
  | "@togetherAI/mistral-7B"
  | "@togetherAI/llama3-8B"
  | "@togetherAI/code-llama3-7Bi"
  | "@togetherAI/striped-hyena-7B";
export type AISource =
  | JackComAIModel
  | TogetherAIModel
  | "huggingface"
  | "ollama"
  | "openai";
export type User = {
  anonymous: boolean;
  authenticated: boolean;
  avatar: string;
  email: string;
  lastSeen: string;
};
export type UserProject = {
  /** browser-assigned key for cache lookup */
  __cacheKey?: string;
  id?: number;
  project_name: string;
  description: string;
};

/**
 * @helper Regex-check string conforms to email pattern
 * @param email Email string
 * @returns `true` if email string is valid */
export function validateEmailString(email: string): boolean {
  return new RegExp(/^\w{3,}@\w+\.\w+$/).test(email);
}

export const MEGABYTE = 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = 4 * MEGABYTE;

export const noOp = () => {};

export const suppressEvent: FormEventHandler = (e) => {
  e.preventDefault();
  if (e.stopPropagation) e.stopPropagation();
};

/** Generate a pseudo-unique component notification channel for user alerts */
export function notificationChannel(str: string) {
  const start = str.slice(0, 18);
  // reduce all alphanumeric chars to a single number by adding their char codes
  const sum = stringToNumber(start);
  if (isNaN(sum)) return Math.floor(Math.random() * 1000);
  return sum % 10000;
}

/** Turn an alphanumeric string into a number */
export function stringToNumber(str?: string) {
  if (!str) return 0;
  return str.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
}

/** Turn a string into snake case */
export function toSnakeCase(str: string) {
  return str.toLowerCase().replace(/\s/, "-");
}

/**
 * Generate a predictable RGB color from some provided string. Restrict generation
 * to avoid dark colors with poor contrast */
export function stringToColor(t: string) {
  const num = stringToNumber(t);
  const red = Math.max(0, (num * 100) % 255);
  const green = Math.max(0, (num * 1000) % 255);
  const blue = Math.max(0, (num * 10000) % 255);
  // convert `rgb(...)` string to hex
  const hex = rgbToHex(red, green, blue);
  // check if color is too dark
  if (red < 128) return stringToColor(t + "a");

  return hex;
}

/** Convert RGB to hex */
export function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/** Convert a hex string to an RGB object */
export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

export type LocalUserSettings = {
  aiProviderAPIKey: string;
  assistantLLM: AISource;
  colorIdent: string;
  embedder: AISource;
  enableCloudStorage: boolean;
  owner: string;
  selectedProject: number;
};

/** Load in LocalStorage settings as an object */
export function getUserSettings(): LocalUserSettings {
  return {
    aiProviderAPIKey: localStorage.getItem(LS_AI_PROVIDER_APIKEY) ?? "",
    assistantLLM: localStorage.getItem(LS_ASSISTANT_KEY) ?? "huggingface",
    colorIdent: localStorage.getItem(LS_COLOR_IDENT_OVERRIDE) ?? "",
    embedder: localStorage.getItem(LS_EMBEDDER_KEY) ?? "huggingface",
    enableCloudStorage: localStorage.getItem(LS_USE_CLOUD_STORE) === "1",
    owner: localStorage.getItem(LS_OWNER_KEY) ?? "",
    selectedProject: Number(localStorage.getItem(LS_ACTIVE_PROJECT) ?? -1)
  } as LocalUserSettings;
}

/** Write user settings from state to device/localStorage */
export function updateUserSettings(d: LocalUserSettings) {
  // Change chat LLM and Embedding model settings
  localStorage.setItem(LS_AI_PROVIDER_APIKEY, d.aiProviderAPIKey);
  localStorage.setItem(LS_ASSISTANT_KEY, d.assistantLLM);
  localStorage.setItem(LS_EMBEDDER_KEY, d.embedder);

  // Cloud Storage settings ("Store Documents online")
  if (d.enableCloudStorage) localStorage.setItem(LS_USE_CLOUD_STORE, "1");
  else localStorage.removeItem(LS_USE_CLOUD_STORE);

  // Application owner handler
  localStorage.setItem(LS_OWNER_KEY, d.owner);

  if (d.selectedProject && d.selectedProject > 0) {
    localStorage.setItem(LS_ACTIVE_PROJECT, d.selectedProject.toString());
  } else localStorage.removeItem(LS_ACTIVE_PROJECT);

  // Custom UI color
  if (d.colorIdent) localStorage.setItem(LS_COLOR_IDENT_OVERRIDE, d.colorIdent);
  else if (d.owner)
    localStorage.setItem(LS_COLOR_IDENT_OVERRIDE, stringToColor(d.owner));
}

/** Shortens string to `XXXX...XXXX`; padding determined by optional `minLength` parameter */
export function truncateMidString(str?: string | null, minLength = 6): string {
  if (!str) return "";
  if (str.length <= minLength) return str;
  const { length } = str;
  const start = str.substring(0, minLength);
  const truncd = `${start}...${str.substring(length - minLength, length)}`;
  return truncd.length > length ? str : truncd;
}

/** Shortens string to `XXXX...`; returns string of minimum length `minLength` */
export function truncateEndString(str?: string | null, minLength = 6): string {
  if (!str) return "";
  if (str.length <= minLength) return str;
  const { length } = str;
  const start = str.substring(0, minLength);
  const truncd = `${start}...`;
  return truncd.length > length ? str : truncd;
}

export function isJackCOMStr(s: string) {
  return /^(@jackcom\/)/gi.test(s);
}

export function isTogetherAIStr(s: string) {
  return /^(@togetherAI\/)/gi.test(s);
}

export function isOpenAIStr(s: string) {
  return /^openai/gi.test(s);
}
