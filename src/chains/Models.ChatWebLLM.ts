export type WebLLMModel =
  // Llama-3
  | "Llama-3-8B-Instruct-q4f32_1-1k"
  | "Llama-3-8B-Instruct-q4f16_1-1k"
  | "Llama-3-8B-Instruct-q4f32_1"
  | "Llama-3-8B-Instruct-q4f16_1"
  | "Llama-3-70B-Instruct-q3f16_1"
  // Llama-2
  | "Llama-2-7b-chat-hf-q4f32_1-1k"
  | "Llama-2-7b-chat-hf-q4f16_1-1k"
  | "Llama-2-7b-chat-hf-q4f32_1"
  | "Llama-2-7b-chat-hf-q4f16_1"
  | "Llama-2-13b-chat-hf-q4f16_1"
  // Mistral variants
  | "WizardMath-7B-V1.1-q4f16_1"
  | "Mistral-7B-Instruct-v0.2-q4f16_1"
  | "OpenHermes-2.5-Mistral-7B-q4f16_1"
  | "NeuralHermes-2.5-Mistral-7B-q4f16_1"
  | "Hermes-2-Pro-Mistral-7B-q4f16_1"
  // Gemma-2B
  | "gemma-2b-it-q4f16_1"
  | "gemma-2b-it-q4f32_1"
  | "gemma-2b-it-q4f16_1-1k"
  | "gemma-2b-it-q4f32_1-1k"
  // RedPajama
  | "RedPajama-INCITE-Chat-3B-v1-q4f16_1"
  | "RedPajama-INCITE-Chat-3B-v1-q4f32_1"
  | "RedPajama-INCITE-Chat-3B-v1-q4f16_1-1k"
  | "RedPajama-INCITE-Chat-3B-v1-q4f32_1-1k"
  // Phi-2
  | "Phi2-q0f16"
  | "Phi2-q0f32"
  | "Phi2-q4f16_1"
  | "Phi2-q4f32_1"
  | "Phi2-q4f16_1-1k"
  | "Phi2-q4f32_1-1k"
  // Phi-1.5
  | "Phi1.5-q0f16"
  | "Phi1.5-q0f32"
  | "Phi1.5-q4f16_1-1k"
  | "Phi1.5-q4f32_1-1k"
  // TinyLlama
  | "TinyLlama-1.1B-Chat-v0.4-q0f16"
  | "TinyLlama-1.1B-Chat-v0.4-q0f32"
  | "TinyLlama-1.1B-Chat-v0.4-q4f16_1-1k"
  | "TinyLlama-1.1B-Chat-v0.4-q4f32_1-1k";

  