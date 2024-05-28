import { ComponentPropsWithRef, ReactNode } from "react";
import "./Slider.scss";

type Props = {
  square?: boolean;
  hint?: ReactNode;
  label?: ReactNode;
} & ComponentPropsWithRef<"input">;

/** @FormComponent Slider / Toggle Checkbox component */
const Slider = (props: Props) => {
  const {
    className,
    disabled,
    hint,
    label,
    square,
    size = "md",
    ...rest
  } = props;
  const bgClass = square ? size : `${size} round`;
  const classes = ["slider", className].join(" ");

  return (
    <label
      className={classes}
      aria-disabled={disabled}
      data-disabled={disabled}
    >
      <span className="slider__grid">
        <span className="slider__control">
          <input type="checkbox" {...rest} />
          <span className={`slider__background ${bgClass}`} />
        </span>

        {label && <span className="label slider__label">{label}</span>}
      </span>

      {hint && <span className="hint">{hint}</span>}
    </label>
  );
};

export default Slider;
