import {
  ComponentPropsWithRef,
  FocusEventHandler,
  KeyboardEventHandler
} from "react";
import { suppressEvent } from "utils/general";

type Props = ComponentPropsWithRef<"span"> & {
  clearOnSubmit?: boolean;
  notifyTextChanged?: { (text: string): any };
};

/** Content-Editable HTML element */
export default function ContentEditable(props: Props) {
  const {
    notifyTextChanged,
    clearOnSubmit,
    className = "",
    children,
    ...rest
  } = props;
  const classes = ["editable", className].join(" ").trim();

  // Handle user input into element. Forward to blur on submit
  const handleTextChange: KeyboardEventHandler<HTMLSpanElement> = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.currentTarget.blur(); // forward event to blur handler
  };

  // Handle when element loses focus
  const handleMaybeSubmit: KeyboardEventHandler<HTMLSpanElement> = (e) => {
    if (e.key === "Enter") suppressEvent(e);
  };

  // Handle when element loses focus
  const handleTextBlur: FocusEventHandler<HTMLSpanElement> = (e) => {
    const next = e.target.innerText.replace("\n", "");
    notifyTextChanged?.(next);
    if (clearOnSubmit) e.target.innerHTML = "";
  };

  return (
    <span
      contentEditable={!props["aria-disabled"]}
      className={classes}
      suppressContentEditableWarning
      onKeyDown={handleMaybeSubmit}
      onKeyUp={handleTextChange}
      onBlur={handleTextBlur}
      children={children}
      {...rest}
    />
  );
}
