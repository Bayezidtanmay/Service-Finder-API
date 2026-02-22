import { useEffect, useState } from "react";
import { api } from "../api";
import Navbar from "../components/Navbar.jsx";

const money = (cents) =>
    cents == null ? "-" : `€${(Number(cents) / 100).toFixed(2)}`;

const fmtDate = (value) => {
    if (!value) return "Not specified";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "Not specified" : d.toLocaleString();
};

export default function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    useEffect(() => {
        loadBookings();
    }, []);

    return (
        <>
            <Navbar />

            <div className="container">
                <div className="row">
                    <h1>My Bookings</h1>
                </div>

                {loading && <p>Loading bookings...</p>}
                {error && <p className="error">{error}</p>}

                {!loading && !error && bookings.length === 0 && (
                    <div className="card">
                        <p>You haven’t created any bookings yet.</p>
                        <p className="subtle">Go to Services to create your first booking.</p>
                    </div>
                )}

                <div className="grid">
                    {bookings.map((b) => (
                        <div key={b.id} className="card">
                            <div className="cardHeader">
                                <div>
                                    <h3 style={{ marginBottom: 6 }}>{b.service?.name || "Service"}</h3>
                                    <div className="subtle">
                                        {b.service?.city ? `📍 ${b.service.city}` : "📍 Location not set"}
                                    </div>
                                </div>

                                {b.status ? (
                                    <span className={`badge ${b.status}`}>
                                        {b.status.replace("_", " ")}
                                    </span>
                                ) : (
                                    <span className="badge">-</span>
                                )}
                            </div>

                            <div className="spacer" />

                            <p>
                                <b>Requested time:</b> {fmtDate(b.requested_time)}
                            </p>

                            <p>
                                <b>Problem:</b> {b.problem_description?.trim() || "-"}
                            </p>

                            <p>
                                <b>Quote:</b> {money(b.quote_cents)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

