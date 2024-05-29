import { ChangeEventHandler, KeyboardEventHandler, useState } from "react";
import "./InputGroup.scss";
import ItemMenu from "./ItemMenu";
import useSubmenuHandler from "hooks/useSubmenuHandler";

type InputGroupOpts = {
  disabled?: boolean;
  allowAttachments?: boolean;
  highlightAttachmentsCtrl?: boolean;
  placeholder?: string;
  label?: string;
  handleSubmit?: { (): any | Promise<any> };
  onChange?: { (v: string): void };
  onAddNewFile?: { (): void };
  onChangeFileContext?: { (): void };
};

/** @Component */
export default function InputGroup(opts: InputGroupOpts) {
  const { disabled } = opts;
  const [text, setText] = useState("");
  const { submenuIsVisible, openSubmenu, target, close } = useSubmenuHandler();
  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();
    setText(e.target.value);
    opts.onChange?.(e.target.value);
  };
  const onSubmit: KeyboardEventHandler = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    opts.handleSubmit?.();
    setText("");
  };
  const handleAddNewFile = () => {
    close();
    if (opts.onAddNewFile) opts.onAddNewFile?.();
  };
  const handleChangeFileContext = () => {
    close();
    opts.onChangeFileContext?.();
  };
  const attachTriggerClass = ["material-symbols-outlined"];
  if (opts.highlightAttachmentsCtrl) attachTriggerClass.push("pulse infinite");

  return (
    <label className="input-group">
      {opts.label && <span className="input-group__label">{opts.label}</span>}

      <input
        className="input-group__input"
        disabled={disabled}
        placeholder={opts.placeholder}
        value={text}
        onChange={onChange}
        onKeyDown={onSubmit}
      />

      <button
        onClick={openSubmenu}
        disabled={!opts.allowAttachments}
        className="button--attach button--round button--transparent button--grid button--float left"
        type="button"
      >
        <span className={attachTriggerClass.join(" ")}>attach_file</span>
      </button>

      <button className="button--send" disabled={disabled} type="button">
        <span className="material-symbols-outlined">send</span>
      </button>

      {submenuIsVisible && (
        <ItemMenu target={target} onClose={close} placement="top">
          <span
            aria-disabled
            data-tooltip="Coming soon"
            className="item-menu__item"
            onClick={handleAddNewFile}
            role="menuitem"
          >
            <span>Add file to chat</span>
            <span className="material-symbols-outlined">attach_file_add</span>
          </span>

          <span
            className="item-menu__item"
            onClick={handleChangeFileContext}
            role="menuitem"
          >
            <span>Load new Document</span>
            <span className="material-symbols-outlined">attach_file</span>
          </span>
        </ItemMenu>
      )}
    </label>
  );
}
