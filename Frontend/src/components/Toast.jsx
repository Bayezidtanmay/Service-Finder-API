import { useEffect } from "react";

export default function Toast({ toasts, remove }) {
    useEffect(() => {
        if (!toasts.length) return;
        const timers = toasts.map((t) =>
            setTimeout(() => remove(t.id), t.ttl ?? 2500)
        );
        return () => timers.forEach(clearTimeout);
    }, [toasts, remove]);

    if (!toasts.length) return null;

    return (
        <div className="toastStack">
            {toasts.map((t) => (
                <div key={t.id} className={`toast ${t.type || "info"}`}>
                    <div className="toastTitle">{t.title || "Notice"}</div>
                    {t.message && <div className="toastMsg">{t.message}</div>}
                    <button className="toastX" onClick={() => remove(t.id)}>×</button>
                </div>
            ))}
        </div>
    );
}