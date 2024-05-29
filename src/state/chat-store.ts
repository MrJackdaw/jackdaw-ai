import createState from "@jackcom/raphsducks";

type ChatMessage = {
  from: string;
  text: string;
  incoming?: boolean;
};

/** IN-memory store that holds chat messages */
export const ChatStore = createState({
  messages: [] as ChatMessage[],
  question: "",
  loading: false
});
