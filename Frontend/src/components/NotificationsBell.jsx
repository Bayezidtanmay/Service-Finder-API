import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";

export default function NotificationsBell() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const wrapRef = useRef(null);

    async function loadCount() {
        try {
            const res = await api("/notifications/unread-count");
            setCount(Number(res?.count || 0));
        } catch {
            // ignore
        }
    }

    async function loadList() {
        try {
            setLoading(true);
            const data = await api("/notifications");
            setItems(Array.isArray(data) ? data : []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCount();
        const t = setInterval(loadCount, 10000); // poll unread count
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!open) return;
        loadList();
    }, [open]);

    useEffect(() => {
        function onClickOutside(e) {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const unreadIds = useMemo(
        () => items.filter((n) => !n.read_at).map((n) => n.id),
        [items]
    );

    async function markRead(id) {
        try {
            await api(`/notifications/${id}/read`, { method: "PATCH" });
            setItems((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
            );
            setCount((c) => Math.max(0, c - 1));
        } catch {
            // ignore
        }
    }

    async function markAllRead() {
        try {
            await api("/notifications/read-all", { method: "PATCH" });
            setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
            setCount(0);
        } catch {
            // ignore
        }
    }

    return (
        <div className="notifWrap" ref={wrapRef}>
            <button className="ghost notifBtn" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
                <span className="notifIcon">🔔</span>
                {count > 0 && <span className="notifBadge">{count > 99 ? "99+" : count}</span>}
            </button>

            {open && (
                <div className="notifPanel">
                    <div className="notifHeader">
                        <div>
                            <div className="notifTitle">Notifications</div>
                            <div className="subtle">{count} unread</div>
                        </div>

                        <div className="actions">
                            <button className="ghost" onClick={loadList} disabled={loading}>
                                {loading ? "Loading..." : "Refresh"}
                            </button>
                            <button className="ghost" onClick={markAllRead} disabled={unreadIds.length === 0}>
                                Mark all read
                            </button>
                        </div>
                    </div>

                    <div className="notifList">
                        {items.length === 0 ? (
                            <div className="notifEmpty subtle">No notifications yet.</div>
                        ) : (
                            items.map((n) => (
                                <div
                                    key={n.id}
                                    className={`notifItem ${n.read_at ? "" : "unread"}`}
                                    onClick={() => !n.read_at && markRead(n.id)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="notifItemTop">
                                        <div className="notifItemTitle">{n.title}</div>
                                        {!n.read_at && <span className="dot" />}
                                    </div>

                                    {n.message && <div className="notifItemMsg subtle">{n.message}</div>}

                                    {n.actor && (
                                        <div className="notifItemMeta subtle">
                                            by {n.actor.name || n.actor.email} ({n.actor.role})
                                        </div>
                                    )}

                                    <div className="notifItemMeta subtle">
                                        {new Date(n.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}