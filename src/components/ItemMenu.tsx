import { useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { clearModal } from "state/modal";
import useClickAwayListener from "hooks/useClickAwayListener";
import "./ItemMenu.scss";

type Placement = "left" | "right" | "top" | "bottom";
type TooltipProps = {
  onClose?: { (): void };
  target?: HTMLElement | null;
  placement?: Placement;
} & React.ComponentPropsWithRef<"aside">;

/**
 * @Component Floating menu component (appears when you click on the "show-more"
 * button of a list-item element). Rendered into alternate `#overlays` HTML root element */
const ItemMenu = (props: TooltipProps) => {
  const { className, children, onClose = clearModal, target: $target } = props;
  const classes = [className || "", "item-menu--container"];
  const $elemRef = useRef<HTMLElement>(null);
  const style = useMemo(() => {
    return $target
      ? positionTooltipNear(
          $target.getBoundingClientRect(),
          $elemRef.current?.getBoundingClientRect().height,
          props.placement
        )
      : undefined;
  }, [$target, $elemRef]);

  useClickAwayListener("item-menu--global", onClose, true, false);

  const $root = document.getElementById("overlays");
  if (!$root) return null;

  const $elem = (
    <aside
      id="item-menu--global"
      role="menu"
      ref={$elemRef}
      aria-roledescription="Item menu or options"
      className={classes.join(" ").trim()}
      style={style}
    >
      {children}
    </aside>
  );

  return createPortal($elem, $root);
};

export default ItemMenu;

/**
 * Position tooltip near a target element (i.e. what was clicked to show the tooltip)
 * @param rect The `.getBoundingClientRect()` result of the target element
 * @param position [position="left"] Requested position relative to target */
function positionTooltipNear(
  rect: DOMRect,
  tooltipHeight = 150,
  position: Placement = "left"
) {
  const { left, top, right, bottom, width, height } = rect;
  const { innerWidth, innerHeight } = window;
  const tooltipWidth = 300;
  const margin = 10; // margin from the target element

  switch (position) {
    case "top": {
      // Position above the element
      return { bottom: height + margin, left: left + margin };
    }

    case "bottom": {
      // Position below the element
      // top: Math.min(top, window.innerHeight - (height + margin))
      return {
        top: Math.max(0, left + width / 2 - tooltipWidth / 2),
        left: Math.min(innerHeight - tooltipHeight, bottom + margin)
      };
    }

    case "left": {
      return {
        left: Math.max(0, left - tooltipWidth - margin),
        top: top + height / 2 - tooltipHeight / 2
      };
    }

    case "right": {
      // Position to the right of the element, ensuring it doesn't overflow the window width
      return {
        left: Math.min(innerWidth - tooltipWidth, right + margin),
        top: top + height / 2 - tooltipHeight / 2
      };
    }
    default:
      throw new Error("Unsupported placement value");
  }
}
