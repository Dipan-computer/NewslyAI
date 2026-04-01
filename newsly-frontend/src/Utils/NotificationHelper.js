export const getNotifications = () => {
  return JSON.parse(localStorage.getItem("newsly_notifications")) || [];
};

export const saveNotifications = (notifications, options = {}) => {
  localStorage.setItem("newsly_notifications", JSON.stringify(notifications));

  window.dispatchEvent(
    new CustomEvent("newsly-notification-added", {
      detail: {
        playSound: options.playSound || false,
      },
    })
  );
};

export const addNotification = ({ type, title, message }) => {
  const existing = getNotifications();

  const duplicateExists = existing.some(
    (item) => item.title === title && item.message === message
  );

  if (duplicateExists) return;

  const newNotification = {
    id: Date.now(),
    type: type || "system",
    title: title || "New update",
    message: message || "Something happened in your app.",
    time: new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
    read: false,
  };

  const updated = [newNotification, ...existing];
  saveNotifications(updated, { playSound: true });
};

export const markAllNotificationsRead = () => {
  const existing = getNotifications();
  const updated = existing.map((item) => ({ ...item, read: true }));
  saveNotifications(updated, { playSound: false });
};

export const clearNotifications = () => {
  localStorage.removeItem("newsly_notifications");

  window.dispatchEvent(
    new CustomEvent("newsly-notification-added", {
      detail: {
        playSound: false,
      },
    })
  );
};

export const deleteNotification = (id) => {
  const existing = getNotifications();
  const updated = existing.filter((item) => item.id !== id);
  saveNotifications(updated, { playSound: false });
};

export const markNotificationRead = (id) => {
  const existing = getNotifications();
  const updated = existing.map((item) =>
    item.id === id ? { ...item, read: true } : item
  );
  saveNotifications(updated, { playSound: false });
};