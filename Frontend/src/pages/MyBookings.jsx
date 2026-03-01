import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import ImageModal from "../components/ImageModal.jsx";

const money = (cents) =>
    cents == null ? "-" : `€${(Number(cents) / 100).toFixed(2)}`;

const fmtDate = (value) => {
    if (!value) return "Not specified";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "Not specified" : d.toLocaleString();
};

const fmtEventTime = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
};

export default function MyBookings() {
    const nav = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // timeline state
    const [openTimelineId, setOpenTimelineId] = useState(null);
    const [eventsByBookingId, setEventsByBookingId] = useState({});
    const [eventsLoadingId, setEventsLoadingId] = useState(null);

    // image modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalSrc, setModalSrc] = useState("");

    const openPhoto = (url) => {
        setModalSrc(`http://127.0.0.1:8000${url}`);
        setModalOpen(true);
    };

    async function loadBookings() {
        try {
            setLoading(true);
            setError("");
            const data = await api("/bookings/me");
            setBookings(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e?.message || "Failed to load bookings");
        } finally {
            setLoading(false);
        }
    }

    async function toggleTimeline(bookingId) {
        if (openTimelineId === bookingId) {
            setOpenTimelineId(null);
            return;
        }

        setOpenTimelineId(bookingId);

        // If already fetched, don’t refetch
        if (eventsByBookingId[bookingId]) return;

        try {
            setEventsLoadingId(bookingId);
            const events = await api(`/bookings/${bookingId}/events`);
            setEventsByBookingId((prev) => ({
                ...prev,
                [bookingId]: Array.isArray(events) ? events : [],
            }));
        } catch (e) {
            setEventsByBookingId((prev) => ({ ...prev, [bookingId]: [] }));
            alert(e?.message || "Failed to load timeline");
        } finally {
            setEventsLoadingId(null);
        }
    }

    useEffect(() => {
        loadBookings();
    }, []);

    return (
        <div className="container">
            <div className="row">
                <h1>My Bookings</h1>
                <button className="ghost" onClick={() => nav("/services")}>
                    Back to services
                </button>
            </div>

            {loading && <p>Loading bookings...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && bookings.length === 0 && (
                <div className="card">
                    <p>You haven’t created any bookings yet.</p>
                    <button className="primary" onClick={() => nav("/services")}>
                        Book a service
                    </button>
                </div>
            )}

            <div className="grid">
                {bookings.map((b) => {
                    const status = b.status || "requested";
                    const open = openTimelineId === b.id;
                    const events = eventsByBookingId[b.id] || [];

                    return (
                        <div key={b.id} className="card">
                            <div className="cardHeader">
                                <div>
                                    <h3 style={{ marginBottom: 6 }}>
                                        {b.service?.name || "Service"}{" "}
                                        <span className="subtle">#{b.id}</span>
                                    </h3>

                                    {b.service?.city && (
                                        <div className="subtle">📍 {b.service.city}</div>
                                    )}
                                </div>

                                <span className={`badge ${status}`}>
                                    {status.replace("_", " ")}
                                </span>
                            </div>

                            <div className="spacer" />

                            <p>
                                <b>Requested time:</b> {fmtDate(b.requested_time)}
                            </p>

                            <p>
                                <b>Problem:</b> {b.problem_description?.trim() || "-"}
                            </p>

                            {/* ✅ Problem photo (click to open fullscreen) */}
                            {b.problem_photo_url && (
                                <div style={{ marginTop: 10 }}>
                                    <img
                                        className="clickableImg"
                                        src={`http://127.0.0.1:8000${b.problem_photo_url}`}
                                        alt="Problem"
                                        onClick={() => openPhoto(b.problem_photo_url)}
                                        style={{
                                            width: "100%",
                                            borderRadius: 12,
                                            border: "1px solid rgba(255,255,255,.08)",
                                        }}
                                    />
                                </div>
                            )}

                            <p style={{ marginTop: 10 }}>
                                <b>Quote:</b> {money(b.quote_cents)}
                            </p>

                            <div className="row" style={{ marginTop: 12 }}>
                                <button className="ghost" onClick={() => toggleTimeline(b.id)}>
                                    {open ? "Hide timeline" : "View timeline"}
                                </button>
                            </div>

                            {open && (
                                <div className="timelineWrap">
                                    {eventsLoadingId === b.id ? (
                                        <p className="subtle">Loading timeline...</p>
                                    ) : events.length === 0 ? (
                                        <p className="subtle">No timeline events yet.</p>
                                    ) : (
                                        <div className="timeline">
                                            {events.map((ev) => (
                                                <div key={ev.id} className="timelineItem">
                                                    <div
                                                        className={`timelineDot ${ev.to_status || ev.type || "info"
                                                            }`}
                                                    />
                                                    <div className="timelineBody">
                                                        <div className="timelineTop">
                                                            <div className="timelineTitle">
                                                                {ev.message ||
                                                                    ev.type?.replace("_", " ") ||
                                                                    "Update"}
                                                            </div>
                                                            <div className="timelineTime">
                                                                {fmtEventTime(ev.created_at)}
                                                            </div>
                                                        </div>

                                                        {(ev.from_status || ev.to_status) && (
                                                            <div className="subtle">
                                                                {ev.from_status ? (
                                                                    <>
                                                                        {ev.from_status.replace("_", " ")} →{" "}
                                                                    </>
                                                                ) : null}
                                                                {ev.to_status ? ev.to_status.replace("_", " ") : ""}
                                                            </div>
                                                        )}

                                                        {ev.quote_cents != null && (
                                                            <div className="subtle">
                                                                Quote: {money(ev.quote_cents)}
                                                            </div>
                                                        )}

                                                        {ev.actor && (
                                                            <div className="subtle">
                                                                By: {ev.actor.name || ev.actor.email} (
                                                                {ev.actor.role})
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Fullscreen image modal */}
            <ImageModal
                open={modalOpen}
                src={modalSrc}
                alt="Problem photo"
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}

