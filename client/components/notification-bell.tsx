"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { useApi } from "@/lib/api";

export function NotificationBell() {
  const { request } = useApi();
  const [open, setOpen] = useState(false);

  const { data: unread } = useSWR("/notifications/unread-count", request, {
    refreshInterval: 20000, // poll every 20s
  });
  const { data: notifications, mutate } = useSWR(
    open ? "/notifications" : null,
    request,
  );

  const handleMarkRead = async (id: string) => {
    await request(`/notifications/${id}/read`, { method: "PATCH" });
    mutate(); // refresh the open dropdown list
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"
      >
        <Bell className="h-4 w-4 cursor-pointer" />
        {!!unread?.count && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {unread.count > 9 ? "9+" : unread.count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
            <div className="border-b px-4 py-3 text-sm font-medium">
              Notifications
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!notifications?.length ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n: any) => (
                  <button
                    key={n._id}
                    onClick={() => !n.isRead && handleMarkRead(n._id)}
                    className={`block w-full border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-accent ${!n.isRead ? "bg-accent/50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{n.title}</span>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-1 text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
