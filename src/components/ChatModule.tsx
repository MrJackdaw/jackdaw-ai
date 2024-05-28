import createState from "@jackcom/raphsducks";
import { useEffect, useMemo, useState } from "react";
import { askAssistant } from "chains";
import { useMboxStore } from "hooks/useMboxStore";
import useUser from "hooks/useUser";
import useSettings from "hooks/useSettings";
import MboxFileLoader from "./Mbox.FileLoader";
import InputGroup from "./InputGroup";
import "./ChatModule.scss";
import Markdown from "react-markdown";

type ChatMessage = {
  from: string;
  text: string;
  incoming?: boolean;
};

const ChatModuleStore = createState({
  messages: [] as ChatMessage[],
  question: "",
  loading: false
});

/** Chat message list and input */
const ChatModule = () => {
  const { owner, colorIdent } = useSettings(["owner", "colorIdent"]);
  const { criticalError } = useUser(["criticalError"]);
  const [state, setState] = useState(ChatModuleStore.getState());
  const { question, messages, loading } = useMemo(
    () => state,
    [state.loading, state.messages, state.question]
  );
  const { vectorStoreLoaded, messagesLoaded } = useMboxStore([
    "vectorStoreLoaded",
    "messagesLoaded"
  ]);
  const emptyMessage = useMemo(() => {
    if (criticalError) return "⚠️ Jackdaw Server is offline";
    if (loading) return "Please wait...";
    if (!messagesLoaded) return "Upload a file";
    if (!messages.length) return "Ask a question";
    return "";
  }, [messagesLoaded]);
  const formDisabled = useMemo(
    () => !vectorStoreLoaded || loading,
    [vectorStoreLoaded, loading]
  );
  /** Send question to API; update messages list */
  const askQuestion = async () => {
    if (!question || loading) return;
    const next = [...messages, { from: owner, text: question }];
    ChatModuleStore.multiple({ loading: true, messages: next });

    try {
      const res = await askAssistant(question);
      if (res) next.push({ from: "Assistant", text: res, incoming: true });
    } catch (error) {
      next.push({
        from: "Application",
        text: "Error generating response",
        incoming: true
      });
    } finally {
      const $view = document.querySelector("#message-view");
      if ($view) $view.scrollTop = $view.scrollHeight;
      ChatModuleStore.multiple({
        messages: next,
        question: "",
        loading: false
      });
    }
  };

  useEffect(() => {
    const unsubscribe = ChatModuleStore.subscribe((s) =>
      setState((prev) => ({ ...prev, ...s }))
    );
    return () => unsubscribe();
  }, []);

  return (
    <section className="module--chat-messages">
      {/* Messages */}
      <div
        id="message-view"
        className="module--chat-messages__list-container"
        data-loaded={messagesLoaded}
        data-error={criticalError}
        data-empty={!messages.length}
        data-empty-message={emptyMessage}
      >
        <div className="list--chat-messages">
          {messages.map(({ incoming, text, from }, i) => (
            <div
              key={i}
              className={`message ${incoming ? "assistant" : "user"}`}
            >
              <div className={`message--${incoming ? "incoming" : "outgoing"}`}>
                <div className="message__text">
                  <b style={incoming ? undefined : { color: colorIdent }}>
                    {from}
                  </b>

                  {text
                    .split("\n")
                    .filter((x) => Boolean(x))
                    .map((t, ti) => (
                      <Markdown key={ti}>{t}</Markdown>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading message */}
      {messagesLoaded && !vectorStoreLoaded && (
        <div className="message--input">
          <span className="spinner--before">Building Local index...</span>
        </div>
      )}

      {/* User text input */}
      {messagesLoaded && vectorStoreLoaded && (
        <InputGroup
          placeholder="Ask a question"
          onChange={ChatModuleStore.question}
          disabled={formDisabled}
          handleSubmit={askQuestion}
        />
      )}

      {/* File loader button (page bottom) */}
      {Boolean(owner) && <MboxFileLoader />}
    </section>
  );
};

export default ChatModule;
