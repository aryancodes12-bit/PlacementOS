
import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Bell,
    CheckCheck,
    Circle,
    Inbox,
    Loader2,
    Trash2,
    Wifi,
    WifiOff,
    X,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    notificationService,
} from "./notification.service";

import {
    useNotificationStore,
} from "./notification.store";

import type {
    NotificationItem,
} from "./notification.types";

const formatRelativeTime = (
    value: string
): string => {
    const date = new Date(value);

    if (
        Number.isNaN(date.getTime())
    ) {
        return "";
    }

    const difference =
        Date.now() - date.getTime();

    const seconds =
        Math.max(
            0,
            Math.floor(
                difference / 1000
            )
        );

    if (seconds < 60) {
        return "Just now";
    }

    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days =
        Math.floor(hours / 24);

    if (days < 7) {
        return `${days}d ago`;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
        }
    );
};

const getNotificationTypeLabel = (
    type: NotificationItem["type"]
): string => {
    const labels: Record<
        NotificationItem["type"],
        string
    > = {
        STREAK_RISK:
            "Streak reminder",

        DSA_REVISION_DUE:
            "DSA revision",

        RESUME_STALE:
            "Resume reminder",

        INTERVIEW_INACTIVE:
            "Interview reminder",

        INTERVIEW_ANALYSIS_READY:
            "Interview analysis",

        DAILY_PLAN_READY:
            "Daily plan",

        RESUME_ANALYSIS_READY:
            "Resume analysis",
    };

    return labels[type];
};

export const NotificationBell = () => {
    const navigate = useNavigate();

    const containerRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const [
        isOpen,
        setIsOpen,
    ] = useState(false);

    const [
        markingAll,
        setMarkingAll,
    ] = useState(false);

    const [
        clearingRead,
        setClearingRead,
    ] = useState(false);

    const [
        activeNotificationId,
        setActiveNotificationId,
    ] = useState<string | null>(
        null
    );

    const [
        deletingNotificationId,
        setDeletingNotificationId,
    ] = useState<string | null>(
        null
    );

    const notifications =
        useNotificationStore(
            (state) =>
                state.notifications
        );

    const unreadCount =
        useNotificationStore(
            (state) =>
                state.unreadCount
        );

    const loading =
        useNotificationStore(
            (state) =>
                state.loading
        );

    const initialized =
        useNotificationStore(
            (state) =>
                state.initialized
        );

    const realtimeConnected =
        useNotificationStore(
            (state) =>
                state.realtimeConnected
        );

    const markReadLocally =
        useNotificationStore(
            (state) =>
                state.markReadLocally
        );

    const markAllReadLocally =
        useNotificationStore(
            (state) =>
                state.markAllReadLocally
        );

    const removeNotificationLocally =
        useNotificationStore(
            (state) =>
                state.removeNotificationLocally
        );

    const clearReadNotificationsLocally =
        useNotificationStore(
            (state) =>
                state.clearReadNotificationsLocally
        );

    const readCount =
        notifications.reduce(
            (
                total,
                notification
            ) =>
                total +
                (notification.isRead
                    ? 1
                    : 0),
            0
        );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleOutsideClick = (
            event: MouseEvent
        ) => {
            const target =
                event.target as Node;

            if (
                containerRef.current &&
                !containerRef.current.contains(
                    target
                )
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (
            event: KeyboardEvent
        ) => {
            if (
                event.key === "Escape"
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [isOpen]);

    const handleNotificationClick =
        async (
            notification:
                NotificationItem
        ) => {
            if (
                deletingNotificationId ===
                notification.id
            ) {
                return;
            }

            setActiveNotificationId(
                notification.id
            );

            try {
                if (
                    !notification.isRead
                ) {
                    const response =
                        await notificationService
                            .markRead(
                                notification.id
                            );

                    markReadLocally(
                        notification.id,
                        response.data.data
                            .notification
                            .readAt ??
                        undefined
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to mark notification as read:",
                    error
                );
            } finally {
                setActiveNotificationId(
                    null
                );

                setIsOpen(false);

                if (
                    notification.link &&
                    notification.link.startsWith(
                        "/"
                    )
                ) {
                    navigate(
                        notification.link
                    );
                }
            }
        };

    const handleMarkAllRead =
        async () => {
            if (
                unreadCount === 0 ||
                markingAll
            ) {
                return;
            }

            setMarkingAll(true);

            try {
                const response =
                    await notificationService
                        .markAllRead();

                markAllReadLocally(
                    response.data.data
                        .readAt
                );
            } catch (error) {
                console.error(
                    "Failed to mark all notifications as read:",
                    error
                );
            } finally {
                setMarkingAll(false);
            }
        };

    const handleDeleteNotification =
        async (
            notification:
                NotificationItem
        ) => {
            if (
                deletingNotificationId
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Delete "${notification.title}"?`
                );

            if (!confirmed) {
                return;
            }

            setDeletingNotificationId(
                notification.id
            );

            try {
                await notificationService
                    .deleteNotification(
                        notification.id
                    );

                removeNotificationLocally(
                    notification.id
                );
            } catch (error) {
                console.error(
                    "Failed to delete notification:",
                    error
                );
            } finally {
                setDeletingNotificationId(
                    null
                );
            }
        };

    const handleClearRead =
        async () => {
            if (
                readCount === 0 ||
                clearingRead
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Delete ${readCount} read notification${readCount === 1
                        ? ""
                        : "s"
                    }?`
                );

            if (!confirmed) {
                return;
            }

            setClearingRead(true);

            try {
                await notificationService
                    .clearReadNotifications();

                clearReadNotificationsLocally();
            } catch (error) {
                console.error(
                    "Failed to clear read notifications:",
                    error
                );
            } finally {
                setClearingRead(false);
            }
        };

    const visibleNotifications =
        notifications.slice(0, 8);

    const badgeText =
        unreadCount > 99
            ? "99+"
            : String(unreadCount);

    return (
        <div
            ref={containerRef}
            className="relative"
        >
            <button
                type="button"
                onClick={() =>
                    setIsOpen(
                        (current) =>
                            !current
                    )
                }
                aria-label={
                    unreadCount > 0
                        ? `${unreadCount} unread notifications`
                        : "Notifications"
                }
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                className={[
                    "relative flex h-10 w-10 items-center justify-center rounded-xl",
                    "border border-border bg-bg-secondary text-text-secondary",
                    "transition hover:border-brand/40 hover:text-brand",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    isOpen
                        ? "border-brand/40 bg-brand-muted text-brand"
                        : "",
                ].join(" ")}
            >
                <Bell
                    size={18}
                    aria-hidden="true"
                />

                {unreadCount > 0 && (
                    <span
                        aria-hidden="true"
                        className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-bg-primary bg-danger px-1 text-[9px] font-bold leading-none text-white"
                    >
                        {badgeText}
                    </span>
                )}
            </button>

            {isOpen && (
                <section
                    role="dialog"
                    aria-label="Notifications"
                    className={[
                        "absolute right-0 top-12 z-[100]",
                        "w-[min(25rem,calc(100vw-2rem))]",
                        "overflow-hidden rounded-2xl border border-border",
                        "bg-bg-secondary shadow-2xl",
                    ].join(" ")}
                >
                    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-text-primary">
                                    Notifications
                                </h2>

                                {unreadCount >
                                    0 && (
                                        <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-semibold text-brand">
                                            {
                                                unreadCount
                                            }{" "}
                                            unread
                                        </span>
                                    )}
                            </div>

                            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-text-tertiary">
                                {realtimeConnected ? (
                                    <>
                                        <Wifi
                                            size={
                                                11
                                            }
                                            className="text-success"
                                        />

                                        <span>
                                            Live updates connected
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <WifiOff
                                            size={
                                                11
                                            }
                                            className="text-warning"
                                        />

                                        <span>
                                            Reconnecting…
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setIsOpen(false)
                            }
                            aria-label="Close notifications"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition hover:bg-bg-tertiary hover:text-text-primary"
                        >
                            <X
                                size={16}
                                aria-hidden="true"
                            />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-text-tertiary">
                            Recent activity
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={
                                    handleMarkAllRead
                                }
                                disabled={
                                    unreadCount ===
                                    0 ||
                                    markingAll
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-brand transition hover:bg-brand-muted disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {markingAll ? (
                                    <Loader2
                                        size={12}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <CheckCheck
                                        size={12}
                                    />
                                )}

                                Mark all read
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleClearRead
                                }
                                disabled={
                                    readCount ===
                                    0 ||
                                    clearingRead
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-danger transition hover:bg-danger-muted disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {clearingRead ? (
                                    <Loader2
                                        size={12}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Trash2
                                        size={12}
                                    />
                                )}

                                Clear read
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[28rem] overflow-y-auto">
                        {loading &&
                            !initialized ? (
                            <div className="flex min-h-48 items-center justify-center">
                                <div className="text-center">
                                    <Loader2
                                        size={22}
                                        className="mx-auto animate-spin text-brand"
                                    />

                                    <p className="mt-3 text-xs text-text-tertiary">
                                        Loading notifications…
                                    </p>
                                </div>
                            </div>
                        ) : visibleNotifications.length ===
                            0 ? (
                            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg-tertiary text-text-tertiary">
                                    <Inbox
                                        size={
                                            20
                                        }
                                    />
                                </div>

                                <p className="mt-4 text-sm font-medium text-text-primary">
                                    You&apos;re all caught up
                                </p>

                                <p className="mt-1 max-w-64 text-xs leading-5 text-text-tertiary">
                                    Readiness reminders and completed AI analyses will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {visibleNotifications.map(
                                    (
                                        notification
                                    ) => {
                                        const isOpening =
                                            activeNotificationId ===
                                            notification.id;

                                        const isDeleting =
                                            deletingNotificationId ===
                                            notification.id;

                                        return (
                                            <div
                                                key={
                                                    notification.id
                                                }
                                                className={[
                                                    "group flex items-start gap-2 px-4 py-4",
                                                    "transition hover:bg-bg-tertiary",
                                                    notification.isRead
                                                        ? ""
                                                        : "bg-brand-muted/30",
                                                ].join(
                                                    " "
                                                )}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleNotificationClick(
                                                            notification
                                                        )
                                                    }
                                                    disabled={
                                                        isOpening ||
                                                        isDeleting
                                                    }
                                                    className="flex min-w-0 flex-1 items-start gap-3 text-left disabled:cursor-wait disabled:opacity-70"
                                                >
                                                    <div className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand-muted text-brand">
                                                        {isOpening ? (
                                                            <Loader2
                                                                size={
                                                                    15
                                                                }
                                                                className="animate-spin"
                                                            />
                                                        ) : (
                                                            <Bell
                                                                size={
                                                                    15
                                                                }
                                                            />
                                                        )}

                                                        {!notification.isRead &&
                                                            !isOpening && (
                                                                <Circle
                                                                    size={
                                                                        7
                                                                    }
                                                                    fill="currentColor"
                                                                    className="absolute -right-0.5 -top-0.5 text-brand"
                                                                />
                                                            )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <p
                                                                className={[
                                                                    "line-clamp-1 text-sm",
                                                                    notification.isRead
                                                                        ? "font-medium text-text-secondary"
                                                                        : "font-semibold text-text-primary",
                                                                ].join(
                                                                    " "
                                                                )}
                                                            >
                                                                {
                                                                    notification.title
                                                                }
                                                            </p>

                                                            <span className="shrink-0 text-[10px] text-text-tertiary">
                                                                {formatRelativeTime(
                                                                    notification.createdAt
                                                                )}
                                                            </span>
                                                        </div>

                                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-tertiary">
                                                            {
                                                                notification.message
                                                            }
                                                        </p>

                                                        <p className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-brand">
                                                            {getNotificationTypeLabel(
                                                                notification.type
                                                            )}
                                                        </p>
                                                    </div>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleDeleteNotification(
                                                            notification
                                                        )
                                                    }
                                                    disabled={
                                                        isDeleting ||
                                                        isOpening
                                                    }
                                                    aria-label={`Delete notification: ${notification.title}`}
                                                    title="Delete notification"
                                                    className={[
                                                        "mt-7 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                                        "text-text-tertiary transition",
                                                        "hover:bg-danger-muted hover:text-danger",
                                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger",
                                                        "disabled:cursor-wait disabled:opacity-50",
                                                        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
                                                    ].join(
                                                        " "
                                                    )}
                                                >
                                                    {isDeleting ? (
                                                        <Loader2
                                                            size={
                                                                14
                                                            }
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Trash2
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </div>

                    {notifications.length >
                        visibleNotifications.length && (
                            <div className="border-t border-border px-5 py-3 text-center">
                                <p className="text-xs text-text-tertiary">
                                    Showing the latest{" "}
                                    {
                                        visibleNotifications.length
                                    }{" "}
                                    notifications
                                </p>
                            </div>
                        )}
                </section>
            )}
        </div>
    );
};

