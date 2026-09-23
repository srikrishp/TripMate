"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type Notification = {
  id: number;
  trip_id: number | null;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    try {
      const response = await api.get(
        "/api/notifications/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications(
        response.data.notifications
      );

      setUnreadCount(
        response.data.unread_count
      );
    } catch (error) {
      console.error(
        "Failed to load notifications",
        error
      );
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(
      loadNotifications,
      60000
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [open]);

  async function markAsRead(
    notification: Notification
  ) {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    try {
      await api.put(
        `/api/notifications/${notification.id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );

      setUnreadCount((count) =>
        Math.max(
          0,
          count -
            (notification.is_read ? 0 : 1)
        )
      );

      if (notification.trip_id) {
        router.push(
          `/trips/${notification.trip_id}`
        );

        setOpen(false);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function markAllAsRead() {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    try {
      setLoading(true);

      await api.put(
        "/api/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteNotification(
    notificationId: number
  ) {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    try {
      await api.delete(
        `/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((current) =>
        current.filter(
          (item) =>
            item.id !== notificationId
        )
      );

      setUnreadCount((count) =>
        Math.max(
          0,
          count -
            (notifications.find(
              (item) =>
                item.id === notificationId
            )?.is_read
              ? 0
              : 1)
        )
      );
    } catch (error) {
      console.error(error);
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case "trip":
        return "✈️";

      case "itinerary":
        return "🗓️";

      case "budget":
        return "💰";

      default:
        return "🔔";
    }
  }

  function formatTime(date: string) {
    const notificationDate =
      new Date(date);

    const now = new Date();

    const diff =
      now.getTime() -
      notificationDate.getTime();

    const minutes = Math.floor(
      diff / 60000
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days}d ago`;
    }

    return notificationDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    );
  }

  return (
    <div
      ref={panelRef}
      className="relative"
    >
      <button
        onClick={() =>
          setOpen((current) => !current)
        }
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-xl transition hover:border-slate-600 hover:bg-slate-800"
        aria-label="Notifications"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">

          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <h3 className="font-semibold text-white">
                Notifications
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto">

            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-4xl">
                  🎉
                </div>

                <p className="mt-3 font-medium text-slate-300">
                  You're all caught up
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  No notifications yet.
                </p>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <div
                    key={notification.id}
                    className={`group border-b border-slate-800/80 p-4 transition ${
                      notification.is_read
                        ? "bg-slate-900"
                        : "bg-blue-500/5"
                    }`}
                  >
                    <div className="flex gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg">
                        {getIcon(
                          notification.notification_type
                        )}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <button
                            onClick={() =>
                              markAsRead(
                                notification
                              )
                            }
                            className="text-left"
                          >
                            <p
                              className={`text-sm font-semibold ${
                                notification.is_read
                                  ? "text-slate-300"
                                  : "text-white"
                              }`}
                            >
                              {notification.title}
                            </p>
                          </button>

                          {!notification.is_read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between">

                          <span className="text-[11px] text-slate-600">
                            {formatTime(
                              notification.created_at
                            )}
                          </span>

                          <div className="flex gap-3 opacity-0 transition group-hover:opacity-100">

                            {!notification.is_read && (
                              <button
                                onClick={() =>
                                  markAsRead(
                                    notification
                                  )
                                }
                                className="text-[11px] text-blue-400 hover:text-blue-300"
                              >
                                Read
                              </button>
                            )}

                            <button
                              onClick={() =>
                                deleteNotification(
                                  notification.id
                                )
                              }
                              className="text-[11px] text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>

                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )
              )
            )}

          </div>
        </div>
      )}
    </div>
  );
}