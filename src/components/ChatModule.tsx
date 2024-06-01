import { useEffect, useMemo, useRef, useState } from "react";
import { askAssistant } from "chains";
import { ChatStore, JChatMessage } from "state/chat-store";
import { useMboxStore } from "hooks/useMboxStore";
import useUser from "hooks/useUser";
import useSettings from "hooks/useSettings";
import InputGroup from "./InputGroup";
import Markdown from "react-markdown";
import { sendFilesToParser } from "mbox/Mbox";
import "./ChatModule.scss";

const ERROR_MSG = {
  from: "Application",
  text: "[Error generating response]",
  incoming: true
};

enum STREAM {
  IDLE,
  START,
  ACTIVE
}

/** Chat message list and input */
const ChatModule = () => {
  const $fileInputRef = useRef<HTMLInputElement>(null);
  const $messageView = useRef<HTMLDivElement>(null);
  const { owner, colorIdent } = useSettings(["owner", "colorIdent"]);
  const { criticalError } = useUser(["criticalError"]);
  const [streamResponse, setStreamResponse] = useState("");
  const [state, setState] = useState(ChatStore.getState());
  const [streamState, setStreamState] = useState(STREAM.IDLE);
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
    if (!messagesLoaded) return "Load a file";
    if (!messages.length) return "Ask a question";
    return "";
  }, [messagesLoaded]);
  const responseClassname = useMemo(() => {
    if (streamState === STREAM.ACTIVE) return "spinner--after";
    if (streamState === STREAM.START) return "spinner--before";
    return undefined;
  }, [streamState]);
  const placeholder = useMemo(() => {
    return messagesLoaded ? "Ask a question" : "( No document loaded )";
  }, [messagesLoaded]);
  const showFilePicker = () => {
    if ($fileInputRef.current) $fileInputRef.current.click();
  };
  const scrollMessagesView = () => {
    const $view = $messageView.current;
    if (!$view) return;
    $view.scrollTop = $view.scrollHeight;
  };
  const updateAndScroll = (messages: JChatMessage[]) => {
    setStreamState(STREAM.IDLE);
    setStreamResponse("");
    ChatStore.multiple({ messages, question: "", loading: false });
    scrollMessagesView();
  };
  /** Send question to API; update messages list */
  const askQuestion = async (q?: string) => {
    const query = q || question;
    if (!query || loading) return;
    const next = [...messages, { from: owner, text: query }];
    ChatStore.multiple({ loading: true, messages: next });
    setStreamState(STREAM.START);
    setStreamResponse("( Thinking... )");
    scrollMessagesView();

    try {
      const res = await askAssistant(query);
      let text = "";
      const chunks: string[] = [];
      setStreamState(STREAM.ACTIVE);
      for await (const chunk of res) {
        chunks.push(chunk);
        text = chunks.join("");
        setStreamResponse(text);
        scrollMessagesView();
      }

      next.push(text ? { from: "Assistant", text, incoming: true } : ERROR_MSG);
      // return updateAndScroll(next);
    } catch (error) {
      console.log("Error generating response::", error);
      next.push(ERROR_MSG);
    } finally {
      updateAndScroll(next);
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
        ref={$messageView}
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
                    className={`message__source ${from}`}
                    style={incoming ? undefined : { color: colorIdent }}
                  >
                    {from}
                  </b>

                  <Markdown>{text}</Markdown>
                </div>
              </div>
            </div>
          ))}

          {streamResponse && (
            // Streams the assistant's response until the message stream is complete
            <div className={`message`}>
              <div className={`message--incoming`}>
                <div className="message__text">
                  <b className="message__source pulse">Assistant</b>

                  <Markdown className={responseClassname}>
                    {streamResponse}
                  </Markdown>
                </div>
              </div>
            </div>
          )}
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
        onAddNewFile={showFilePicker}
        onChange={ChatStore.question}
        disabled={!vectorStoreLoaded}
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
