import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

const { VITE_TAVILY } = import.meta.env;

export const searchTool = new TavilySearchResults({
  apiKey: VITE_TAVILY
});
