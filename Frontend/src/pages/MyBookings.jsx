import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const money = (cents) =>
    cents == null ? "-" : `€${(Number(cents) / 100).toFixed(2)}`;

const fmtDate = (value) => {
    if (!value) return "Not specified";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "Not specified" : d.toLocaleString();
};

export default function MyBookings() {
    const nav = useNavigate();

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
        <div className="container">
            <div className="row">
                <h1>My Bookings</h1>
                <button onClick={() => nav("/services")}>Back to services</button>
            </div>

            {loading && <p>Loading bookings...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && bookings.length === 0 && (
                <div className="card">
                    <p>You haven’t created any bookings yet.</p>
                    <button onClick={() => nav("/services")}>Book a service</button>
                </div>
            )}

            <div className="grid">
                {bookings.map((b) => (
                    <div key={b.id} className="card">
                        <h3>{b.service?.name || "Service"}</h3>

                        {b.service?.city && (
                            <p>
                                <b>City:</b> {b.service.city}
                            </p>
                        )}

                        <p>
                            <b>Status:</b>{" "}
                            <span style={{ textTransform: "capitalize" }}>
                                {b.status || "-"}
                            </span>
                        </p>

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
    );
}

