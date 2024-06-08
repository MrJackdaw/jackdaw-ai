import { env, pipeline } from "@xenova/transformers";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Embeddings } from "@langchain/core/embeddings";
import { TogetherAIEmbeddings } from "@langchain/community/embeddings/togetherai";

export const dBertUncased = "Xenova/distilbert-base-uncased-distilled-squad";
export const dBertCased = "Xenova/distilbert-base-cased-distilled-squad";
export const robertaBaseONNX = "iagovar/roberta-base-bne-sqac-onnx";

/** @HuggingFace Xenova embedding models */
export const XENOVA_MINILM_L6_v2 = "Xenova/all-MiniLM-L6-v2";
export const XENOVA_GTE_SMALL = "Xenova/gte-small";

/**
 * Classes use the Singleton pattern to ensure that only one instance of the
 * pipeline is loaded. This is because loading the pipeline is an expensive
 * operation and we don't want to do it every time we want to translate a sentence.
 */
class AsyncSingleton {
  static quantized = true;
  /** @type {ReturnType<typeof @import("@xenova/transformers").pipeline>} */
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback,
        quantized: this.quantized
      });
    }

    return this.instance;
  }
}

/**
 * @Embedder Text embedding (Hugging Face feacture-extraction models). Takes a blurb
 * of text and turns it into a bunch of number-lists (vectors) for similarity searching. */
export class HFEmbedder extends AsyncSingleton {
  static task = "feature-extraction";
  static model = XENOVA_MINILM_L6_v2;
  /** @type {HuggingFaceTransformersEmbeddings} */
  static instance = null;

  static async getInstance() {
    /* ViteJS workaround: do this to allow model-downloading during local development.
     * Xenovia Package needs to 404 when searching for models in cache before fetching directly from
     * huggingface. However, the environment  will always always return 200 status code for
     * missing (404 response) files, which writes empty model data (instead of JSON) to the browser
     * cache, and breaks any reference to them.
     *
     * In this case, we enable model caching after manually loading at least once. */
    env.allowLocalModels = Boolean(this.instance);

    // Load and cache the instance and Q/A models
    if (this.instance === null) {
      // Asynchronously preload the question-answerer model
      // Promise.all([
      //   pipeline("question-answering", robertaBaseONNX, { quantized: true }),
      //   pipeline("feature-extraction", XENOVA_MINILM_L6_v2, { quantized: true })
      // ]).then(() => {
      //   if (!import.meta.env.DEV) return;
      //   console.log(
      //     `Local QA preloaded (${robertaBaseONNX},${XENOVA_MINILM_L6_v2})`
      //   );
      // });

      const batchSize = 100;
      this.instance = new HuggingFaceTransformersEmbeddings({
        model: this.model,
        batchSize,
        stripNewLines: true
      });
    } else if (import.meta.env.DEV)
      console.log("HFEmbedder.getInstance::exists");

    return this.instance;
  }
}

/**
 * OpenAI embeddings wrapper (requires user-supplied API keys).
 */
export class OpenAIEmbedder extends AsyncSingleton {
  static task = "feature-extraction";

  /** @type {OpenAIEmbeddings} */
  static instance = null;
  static key = "";

  /**
   * User-supplied API key is required (never stored)
   * @param {Object} opts
   * @param {string} [opts.apiKey=""] */
  static async getInstance({ apiKey = "" }) {
    if (!this.instance || this.apiKey !== apiKey) {
      this.apiKey = apiKey;
      // re-create instance if API key changed
      this.instance = new OpenAIEmbeddings({
        apiKey,
        model: "text-embedding-3-small",
        verbose: true
      });
    }

    return Promise.resolve(this.instance);
  }
}

/**
 * @typedef {"togetherAI/mistral-7B"|"togetherAI/llama3-8B"|"togetherAI/code-llama3-7Bi"|"togetherAI/striped-hyena-7B"} TogetherAIModel
 * Wrapper for TogetherAI Embeddings model
 */
export class JTogetherAIEmbedder extends AsyncSingleton {
  static task = "feature-extraction";
  /** @type {TogetherAIModel} */
  static llmTarget = "togetherAI/openai-3";
  static model = "togethercomputer/m2-bert-80M-32k-retrieval";

  /** @type {TogetherAIEmbeddings} */
  static instance = null;

  /**
   * @param {object} opts
   * @param {string} opts.apiKey TogetherAI api key (required)
   * @param {TogetherAIModel} opts.llmTarget */
  static async getInstance({ apiKey, llmTarget = "togetherAI/llama3-8B" }) {
    if (!this.instance) {
      this.llmTarget = llmTarget;
      this.instance = new TogetherAIEmbeddings({
        apiKey,
        model: this.model,
        maxConcurrency: 2
      });
    }

    return Promise.resolve(this.instance);
  }
}

/**
 * @typedef {"@jackcom/openai-3"|"@jackcom/openai-4T"|"@jackcom/openai-4o"} JackComAIModel
 * Wrapper for OpenAI proxy (no user api key required)
 */
export class JOpenAIEmbedder extends AsyncSingleton {
  static task = "feature-extraction";
  /** @type {JackComAIModel} */
  static llmTarget = "@jackcom/openai-3";

  /** @type {JOpenAIEmbeddings} */
  static instance = null;

  /**
   * @param {object} opts
   * @param {JackComAIModel} opts.llmTarget */
  static async getInstance({ llmTarget = "@jackcom/openai-3" }) {
    if (!this.instance) {
      this.llmTarget = llmTarget;
      this.instance = new JOpenAIEmbeddings({ llmTarget });
    }

    return Promise.resolve(this.instance);
  }
}

/**
 * JACKCOM proxy: generates the actual embeddings via the JackCom server. Designed
 * to handle OpenAI and TogetherAI (hopefully provide users with more model options) */
class JOpenAIEmbeddings extends Embeddings {
  /** Server URL for making requests */
  timeout = 1500;
  /** @type {JackComAIModel} llmTarget */
  _llmTarget = "@jackcom/openai-3";

  constructor(args) {
    super(args);
    if (args.llmTarget) this._llmTarget = args.llmTarget;
  }

  get url() {
    return `${import.meta.env.VITE_SERVER_URL}/jackcom-ai`;
  }

  /**
   * @param {{ action: string; data: string| string[]}} data Data to send
   * @returns {RequestInit} data for making a fetch request */
  requestOptions(data) {
    return {
      method: "post",
      credentials: "include",
      body: JSON.stringify(data)
    };
  }

  /**
   * Generate vectors from Lambda function
   * @param {{ action: string; data: string| string[]}} requestData Data to send
   * @returns {number[]|number[][]} Vector List
   */
  request(requestData) {
    return fetch(this.url, this.requestOptions(requestData))
      .then((d) => d.json())
      .then(({ data }) => data);
  }

  /**
   * Method to generate embeddings for an array of documents. Splits the
   * documents into batches and makes requests to the OpenAI API proxy to generate
   * embeddings.
   * @param {string[]} texts Array of documents to generate embeddings for.
   * @returns {Promise<number[][]>} Promise that resolves to a 2D array of embeddings for each document.
   */
  async embedDocuments(texts) {
    if (!texts || !texts.length) return Promise.resolve([]);
    return this.request({
      action: "assistant:embed-docs",
      data: { texts },
      assistantLLM: this._llmTarget
    });
  }
  /**
   * Method to generate an embedding for a single document. Calls the
   * embeddingWithRetry method with the document as the input.
   * @param {string} text Document to generate an embedding for.
   * @returns {Promise<number[]>} Promise that resolves to an embedding for the document.
   */
  async embedQuery(text) {
    if (!text) return Promise.resolve([]);

    return this.request({ action: "assistant:embed-query", data: { text } });
  }
}
