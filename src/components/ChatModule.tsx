import { useEffect, useMemo, useRef, useState } from "react";
import { askAssistant } from "chains";
import { ChatStore } from "state/chat-store";
import { useMboxStore } from "hooks/useMboxStore";
import useUser from "hooks/useUser";
import useSettings from "hooks/useSettings";
import InputGroup from "./InputGroup";
import Markdown from "react-markdown";
import { sendFilesToParser } from "mbox/Mbox";
import "./ChatModule.scss";

/** Chat message list and input */
const ChatModule = () => {
  const $fileInputRef = useRef<HTMLInputElement>(null);
  const { owner, colorIdent } = useSettings(["owner", "colorIdent"]);
  const { criticalError } = useUser(["criticalError"]);
  const [state, setState] = useState(ChatStore.getState());
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
  const placeholder = useMemo(() => {
    return messagesLoaded ? "Ask a question" : "( No document loaded )";
  }, [messagesLoaded]);
  const formDisabled = useMemo(
    () => !vectorStoreLoaded || loading,
    [vectorStoreLoaded, loading]
  );
  const showFilePicker = () => {
    if ($fileInputRef.current) $fileInputRef.current.click();
  };
  /** Send question to API; update messages list */
  const askQuestion = async () => {
    if (!question || loading) return;
    const next = [...messages, { from: owner, text: question }];
    ChatStore.multiple({ loading: true, messages: next });

    try {
      const res = await askAssistant(question);
      if (res) next.push({ from: "Assistant", text: res, incoming: true });
    } catch (error) {
      console.log("Error generating response::", error);
      next.push({
        from: "Application",
        text: "Error generating response",
        incoming: true
      });
    } finally {
      const $view = document.querySelector("#message-view");
      if ($view) $view.scrollTop = $view.scrollHeight;
      ChatStore.multiple({
        messages: next,
        question: "",
        loading: false
      });
    }
  };

  useEffect(() => {
    const onState = () => setState(ChatStore.getState());
    return ChatStore.subscribe(onState);
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
                  <b
                    className="message__source"
                    style={incoming ? undefined : { color: colorIdent }}
                  >
                    {from}
                  </b>

                  <Markdown>{text}</Markdown>
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
      <InputGroup
        allowAttachments
        highlightAttachmentsCtrl={!messagesLoaded}
        placeholder={placeholder}
        onChange={ChatStore.question}
        onChangeFileContext={showFilePicker}
        disabled={formDisabled}
        handleSubmit={askQuestion}
      />
      <input
        type="file"
        ref={$fileInputRef}
        onChange={({ currentTarget }) => sendFilesToParser(currentTarget.files)}
        hidden
      />
    </section>
  );
};

export default ChatModule;
