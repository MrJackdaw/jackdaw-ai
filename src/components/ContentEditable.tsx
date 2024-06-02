import {
  ComponentPropsWithRef,
  FocusEventHandler,
  KeyboardEventHandler
} from "react";
import { suppressEvent } from "utils/general";

type Props = ComponentPropsWithRef<"span"> & {
  clearOnSubmit?: boolean;
  submitOnBlur?: boolean;
  notifyTextChanged?: { (text: string): any };
};

/** Content-Editable HTML element. Styleable replacement for `<input />` or `<textarea />` */
export default function ContentEditable(props: Props) {
  const {
    notifyTextChanged,
    clearOnSubmit,
    className = "",
    children,
    submitOnBlur,
    ...rest
  } = props;
  const classes = ["editable", className].join(" ").trim();

  /** Forward element contents to parent when "submit" event is verified */
  const handleSubmit = ($elem: HTMLElement) => {
    const next = $elem.innerText.replace("\n", "");
    notifyTextChanged?.(next);
    if (clearOnSubmit) $elem.innerHTML = "";
  };

  /** Handle user input into element. Forward to blur on submit */
  const handleTextChange: KeyboardEventHandler<HTMLSpanElement> = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // forward event to blur handler if "submit-on-blur" is enabled
    if (submitOnBlur) return e.currentTarget.blur();

    // submit on "Enter" key-press
    handleSubmit(e.currentTarget);
  };

  /** Prevent line-break on "Enter" key-down event unless shift key is enabled.
   * The actual "submission" event is captured by the "onKeyUp" handler  */
  const preventLinebreakOnEnter: KeyboardEventHandler<HTMLSpanElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) suppressEvent(e);
  };

  /** Maybe submit content when element loses focus */
  const handleTextBlur: FocusEventHandler<HTMLSpanElement> = (e) => {
    if (submitOnBlur) handleSubmit(e.target);
  };

  return (
    <span
      contentEditable={!props["aria-disabled"]}
      className={classes}
      suppressContentEditableWarning
      onKeyDown={preventLinebreakOnEnter}
      onKeyUp={handleTextChange}
      onBlur={handleTextBlur}
      children={children}
      {...rest}
    />
  );
}
