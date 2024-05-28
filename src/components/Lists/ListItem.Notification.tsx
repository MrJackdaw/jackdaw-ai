import { AnimationEventHandler, useEffect, useMemo, useRef } from "react";
import { Alert, removeNotification } from "state/notifications";
import useEscapeKeyListener from "hooks/useEscapeKeyListener";
import SVGCloseButton from "../CloseButton";
import "./ListItem.Notification.css";
import { noOp } from "utils/general";

type NotificationProps = {
  notification: Alert;
  error?: boolean;
} & React.ComponentPropsWithRef<"div" | "section" | "button">;

/** @ListItemComponent A `notification` shows a message from the semi-dedicated `notifications` global state */
export const Notification = (props: NotificationProps) => {
  const { notification } = props;
  const error = notification.type === "error";
  const onClear = () => removeNotification(notification.time);
  const exitClass = "slide-out-right";
  const msg = useMemo(() => {
    if (!notification) return "";
    return notification.msg || "";
  }, [notification]);
  const iconClass = useMemo(() => {
    const { type } = notification;
    if (type === "warning") return "bgColor--text";
    return "gold--text";
  }, [error, notification]);
  const icon = useMemo(() => {
    if (error || notification?.type === "warning")
      return String.fromCodePoint(0x26a0);
    return String.fromCodePoint(0x2714);
  }, [error, notification]);
  const duration = useMemo(() => {
    if (!notification || notification.persistent) return 0;
    const wordLength = msg.split(/\s/).length * 1000 + 1500;
    return Math.max(wordLength, 5000);
  }, [notification]);
  const ref = useRef<HTMLDivElement>(null);
  const onAnimationEnded: AnimationEventHandler = (e) => {
    const tg = e.currentTarget as HTMLElement;
    if (tg.classList.contains(exitClass)) onClear();
  };

  useEffect(() => {
    if (duration === 0) return noOp;
    const timeout = setTimeout(onClear, duration);
    return () => clearTimeout(timeout);
  }, [duration]);

  useEscapeKeyListener(onClear);

  return (
    <aside
      ref={ref}
      className={`notification__item ${notification.type} slide-in-left`}
      onAnimationEnd={onAnimationEnded}
    >
      {/* Close notification button */}
      <SVGCloseButton onClick={onClear} />

      {notification.persistent && notification.type === "info" ? (
        // show spinner for loading notifications of type 'info'
        <span className="spinner--before" />
      ) : (
        <MatIcon icon={icon} className={iconClass} />
      )}

      <div>
        <b>{msg}</b>
      </div>
    </aside>
  );
};

export default Notification;

function MatIcon({ icon, className }: { icon: string; className?: string }) {
  return <i className={`material-icons ${className}`}>{icon}</i>;
}
