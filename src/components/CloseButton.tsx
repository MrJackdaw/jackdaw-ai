import { MouseEventHandler, SVGProps } from "react";
//
type CloseButtonProps = {
  passThrough?: boolean;
  onClick?: MouseEventHandler<never>;
  className?: string;
  size?: number;
  stroke?: string;
  strokeWidth?: number | null;
  x?: number;
  y?: number;
} & SVGProps<SVGSVGElement>;

export default function SVGCloseButton(props: CloseButtonProps) {
  const {
    passThrough = false,
    onClick: action = () => {},
    size = 24,
    stroke = "#ff7630",
    ...rest
  } = props;
  let sc = `close-button selectable${passThrough ? " pass-through" : ""}`;
  sc = `${sc} ${props.className}`.trim();

  return (
    <svg className={sc} width={size} height={size} {...rest}>
      <path
        stroke={stroke}
        pointerEvents="none"
        strokeWidth={props.strokeWidth || size / 12}
        d={`M0,0 L${size},${size} M${size},0 L0,${size}`}
      />
      <rect
        className="selectable"
        onClick={passThrough ? undefined : action}
        pointerEvents="all"
        fill="transparent"
        fillOpacity={1}
        width={size}
        height={size}
      />
    </svg>
  );
}
