import {
  ComponentPropsWithRef,
  FocusEventHandler,
  KeyboardEventHandler
} from "react";

type Props = {
  notifyTextChanged?: { (text: string): any };
} & ComponentPropsWithRef<"span">;

/** Content-Editable HTML element */
export default function ContentEditable(props: Props) {
  const { notifyTextChanged, className = "", ...rest } = props;
  // Handle user input into element. Forward to blur on submit
  const handleTextChange: KeyboardEventHandler<HTMLSpanElement> = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.currentTarget.blur(); // forward event to blur handler
  };

  // Handle when element loses focus
  const handleTextBlur: FocusEventHandler<HTMLSpanElement> = (e) => {
    const next = e.target.innerText.replace("\n", "");
    notifyTextChanged?.(next);
  };
  const classes = ["editable", className].join(" ").trim();

  return (
    <span
      contentEditable
      className={classes}
      suppressContentEditableWarning
      onKeyDown={handleTextChange}
      onBlur={handleTextBlur}
      {...rest}
    >
      {props.children}
    </span>
  );
}
