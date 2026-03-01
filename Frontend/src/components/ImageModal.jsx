import { useEffect } from "react";

export default function ImageModal({ open, src, alt = "Image", onClose }) {
    useEffect(() => {
        if (!open) return;

        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modalOverlay" onMouseDown={onClose}>
            <div className="modalContent" onMouseDown={(e) => e.stopPropagation()}>
                <button className="modalClose" onClick={onClose} aria-label="Close">
                    ✕
                </button>

                <img className="modalImg" src={src} alt={alt} />
            </div>
        </div>
    );
}