import { useState } from "react";
import ContentEditable from "./ContentEditable";
import "./InputGroup.scss";

type InputGroupOpts = {
  disabled?: boolean;
  allowAttachments?: boolean;
  highlightAttachmentsCtrl?: boolean;
  placeholder?: string;
  handleSubmit?: { (v: string): any | Promise<any> };
  onChange?: { (v: string): void };
  onAddNewFile?: { (): void };
};

/** @Component */
export default function InputGroup(opts: InputGroupOpts) {
  const { disabled } = opts;
  const [text, setText] = useState("");
  const handleAddNewFile = () => opts.onAddNewFile?.();
  const handleTextChange = (value: string) => {
    opts.onChange?.(value);
    opts.handleSubmit?.(value);
    setText("");
  };
  const btnClass = ["button--attach", "material-symbols-outlined"];
  if (opts.highlightAttachmentsCtrl) btnClass.push("pulse infinite");

  return (
    <section className="input-group">
      <button
        onClick={handleAddNewFile}
        disabled={!opts.allowAttachments}
        className={btnClass.join(" ")}
        type="button"
      >
        attach_file
      </button>

      <ContentEditable
        aria-disabled={disabled}
        className="input-group__input"
        clearOnSubmit
        notifyTextChanged={handleTextChange}
      >
        {text}
      </ContentEditable>

      <button className="button--send" disabled={disabled} type="button">
        <span className="material-symbols-outlined">send</span>
      </button>
    </section>
  );
}
