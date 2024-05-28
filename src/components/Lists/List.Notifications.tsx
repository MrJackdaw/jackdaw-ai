import { createPortal } from "react-dom";
import Notification from "./ListItem.Notification";
import { useEffect, useState } from "react";
import { Notifications, NotificationsStore } from "state/notifications";
import "./List.Notifications.css";

/** @ListComponent Specialized component that shows recent global notifications. */
const NotificationsList = () => {
  const { lastTenNotifications: msgs } = useNotifications();
  const $target = document.getElementById("overlays");
  if (!$target || !msgs.length) return <></>;
  const $notifications = (
    <div className="notifications-list slide-in-right">
      {msgs.map((m, i) => (
        <Notification key={`${i}-${m.time}`} notification={m} />
      ))}
    </div>
  );

  return createPortal($notifications, $target);
};

export default NotificationsList;

/**
 * Listen to notifications/`Alerts`. Mainly used by `ActiveNotification` component
 * @returns Last ten notifications published to app`
 */
function useNotifications() {
  const { all, active } = Notifications.getState();
  const [msgs, setMsgs] = useState([...all]);
  const onNotification = (n: Partial<NotificationsStore>) => {
    if (!Array.isArray(n.all)) return;
    const newnotes = n.all.slice(-10);
    setMsgs(newnotes);
  };

  useEffect(() => Notifications.subscribe(onNotification), []);

  return { lastTenNotifications: msgs, all, active };
}
