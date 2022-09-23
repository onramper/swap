import { createContext, useContext } from "react";
import { AddNotificationPayload, Notifications } from "./notifications.models";

export const NotificationContext = createContext<{
  notifications: Notifications;
  addNotification: (payload: AddNotificationPayload) => void;
  removeNotification: (id: string) => void;
  removeAllNotifications: () => void;
}>({
  notifications: [],
  addNotification: () => undefined,
  removeNotification: () => undefined,
  removeAllNotifications: () => undefined,
});

export function useWidgetNotifications() {
  return useContext(NotificationContext);
}
