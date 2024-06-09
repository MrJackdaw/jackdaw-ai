import { useState } from "react";
import useSubmenuHandler from "hooks/useSubmenuHandler";
import ContentEditable from "./ContentEditable";
import ItemMenu, { MenuItem } from "./ItemMenu";
import "./InputGroup.scss";

type InputGroupOpts = {
  disabled?: boolean;
  allowAttachments?: boolean;
  highlightAttachmentsCtrl?: boolean;
  placeholder?: string;
  handleSubmit?: { (v: string): any | Promise<any> };
  onChange?: { (v: string): void };
  onAddNewFile?: { (): void };
  onSplitFile?: { (): void };
};

/** @Component */
export default function InputGroup(opts: InputGroupOpts) {
  const submenu = useSubmenuHandler();
  const { disabled } = opts;
  const [text, setText] = useState("");
  const handleNewFile = () => {
    submenu.close();
    opts.onAddNewFile?.();
  };
  const handleSplitFile = () => {
    submenu.close();
    opts.onSplitFile?.();
  };
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
        onClick={submenu.submenuIsVisible ? submenu.close : submenu.open}
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

      {submenu.submenuIsVisible && (
        <ItemMenu
          className="no-footer"
          target={submenu.target}
          onClose={submenu.close}
          placement="top"
        >
          <MenuItem onClick={handleNewFile}>
            <span>Load new File</span>
            <span className="material-symbols-outlined">upload</span>
          </MenuItem>

          <MenuItem onClick={handleSplitFile}>
            <span>Split large file</span>
            <span className="material-symbols-outlined">
              splitscreen_portrait
            </span>
          </MenuItem>
        </ItemMenu>
      )}
    </section>
  );
}
