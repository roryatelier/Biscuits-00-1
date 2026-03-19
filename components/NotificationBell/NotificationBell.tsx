'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/lib/actions/notifications';
import { timeAgo } from '@/lib/utils/timeAgo';
import styles from './NotificationBell.module.css';

type NotificationItem = Awaited<ReturnType<typeof listNotifications>>[number];

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUnreadCount().then(setUnread);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      const items = await listNotifications();
      setNotifications(items);
      setLoading(false);
    }
  }, [open]);

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.read) {
      await markAsRead(n.id);
      setUnread((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
    }
    setOpen(false);
    router.push(`/projects/${n.activity.projectId}`);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setUnread(0);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className={styles.wrapper} ref={panelRef}>
      <button
        className={`${styles.bellButton} ${unread > 0 ? styles.hasUnread : ''}`}
        onClick={handleToggle}
        aria-label="Notifications"
        title="Notifications"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className={styles.badge}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {unread === 0 && (
          <span className={styles.label}>Notifications</span>
        )}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Notifications</span>
            {unread > 0 && (
              <span className={styles.panelCount}>{unread} new</span>
            )}
          </div>

          <div className={styles.panelBody}>
            {loading && (
              <p className={styles.emptyText}>Loading...</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className={styles.emptyText}>No notifications yet</p>
            )}
            {!loading &&
              notifications.map((n) => (
                <button
                  key={n.id}
                  className={`${styles.item} ${!n.read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  {!n.read && <span className={styles.unreadDot} />}
                  <div className={styles.itemBody}>
                    <div className={styles.itemContent}>
                      <span className={styles.itemWho}>
                        {n.activity.user.name || 'Someone'}
                      </span>{' '}
                      <span className={styles.itemWhat}>
                        {n.activity.description}
                      </span>
                      {n.activity.project && (
                        <span className={styles.itemProject}>
                          {' '}in {n.activity.project.name}
                        </span>
                      )}
                    </div>
                    <span className={styles.itemTime}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </button>
              ))}
          </div>

          {notifications.length > 0 && (
            <div className={styles.panelFooter}>
              <button
                className={styles.markAllBtn}
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
