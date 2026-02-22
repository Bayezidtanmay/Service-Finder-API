import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const money = (cents) =>
    cents == null ? "-" : `€${(Number(cents) / 100).toFixed(2)}`;

export default function TechnicianBookings() {
    const nav = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Local form state per booking
    const [quoteEurosById, setQuoteEurosById] = useState({});
    const [statusById, setStatusById] = useState({});
    const [savingId, setSavingId] = useState(null);

    async function load() {
        try {
            setLoading(true);
            setError("");
            const data = await api("/technician/bookings");
            setBookings(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || "Failed to load technician bookings");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    // Split for UI clarity
    const { unassignedRequested, assignedToMe } = useMemo(() => {
        const unassignedRequested = [];
        const assignedToMe = [];
        for (const b of bookings) {
            if (!b.technician_id && b.status === "requested") unassignedRequested.push(b);
            else assignedToMe.push(b);
        }
        return { unassignedRequested, assignedToMe };
    }, [bookings]);

    async function acceptBooking(id) {
        try {
            setSavingId(id);
            await api(`/technician/bookings/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ action: "accept" }),
            });
            await load();
        } catch (e) {
            alert(e.message || "Failed to accept booking");
        } finally {
            setSavingId(null);
        }
    }

    async function updateBooking(id) {
        const quoteEuros = quoteEurosById[id];
        const status = statusById[id];

        // Convert € -> cents
        let quote_cents = null;
        if (quoteEuros !== undefined && quoteEuros !== "") {
            const n = Number(quoteEuros);
            if (Number.isNaN(n) || n < 0) {
                alert("Quote must be a valid number (>= 0).");
                return;
            }
            quote_cents = Math.round(n * 100);
        }

        const payload = {};
        if (status) payload.status = status;
        if (quoteEuros !== undefined) payload.quote_cents = quote_cents;

        try {
            setSavingId(id);
            await api(`/technician/bookings/${id}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });
            await load();
        } catch (e) {
            alert(e.message || "Failed to update booking");
        } finally {
            setSavingId(null);
        }
    }

    return (
        <div className="container">
            <div className="row">
                <h1>Technician Dashboard</h1>
                <button onClick={() => nav("/services")}>Back to services</button>
            </div>

            {loading && <p>Loading bookings...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && (
                <>
                    {/* Unassigned Requested */}
                    <div className="card" style={{ marginTop: 16 }}>
                        <h2 style={{ marginTop: 0 }}>Unassigned Requests</h2>
                        {unassignedRequested.length === 0 ? (
                            <p>No unassigned requested bookings right now.</p>
                        ) : (
                            <div className="grid">
                                {unassignedRequested.map((b) => (
                                    <div key={b.id} className="card">
                                        <h3>{b.service?.name || "Service"}</h3>
                                        <p><b>City:</b> {b.service?.city || "-"}</p>
                                        <p><b>Customer:</b> {b.user?.name || b.user?.email || "-"}</p>
                                        <p><b>Status:</b> {b.status}</p>
                                        <p><b>Description:</b> {b.problem_description || "-"}</p>

                                        <button
                                            onClick={() => acceptBooking(b.id)}
                                            disabled={savingId === b.id}
                                        >
                                            {savingId === b.id ? "Accepting..." : "Accept"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Assigned */}
                    <div className="card" style={{ marginTop: 16 }}>
                        <h2 style={{ marginTop: 0 }}>My Assigned Bookings</h2>

                        {assignedToMe.length === 0 ? (
                            <p>No assigned bookings yet.</p>
                        ) : (
                            <div className="grid">
                                {assignedToMe.map((b) => (
                                    <div key={b.id} className="card">
                                        <h3>{b.service?.name || "Service"}</h3>

                                        <p><b>City:</b> {b.service?.city || "-"}</p>
                                        <p><b>Customer:</b> {b.user?.name || b.user?.email || "-"}</p>

                                        <p style={{ marginBottom: 6 }}>
                                            <b>Status:</b>{" "}
                                            <span style={{ textTransform: "capitalize" }}>
                                                {b.status}
                                            </span>
                                        </p>

                                        <p style={{ marginBottom: 6 }}>
                                            <b>Current quote:</b> {money(b.quote_cents)}
                                        </p>

                                        <p><b>Description:</b> {b.problem_description || "-"}</p>

                                        <label>Update status</label>
                                        <select
                                            value={statusById[b.id] ?? ""}
                                            onChange={(e) =>
                                                setStatusById((s) => ({ ...s, [b.id]: e.target.value }))
                                            }
                                        >
                                            <option value="">(keep same)</option>
                                            <option value="accepted">accepted</option>
                                            <option value="quoted">quoted</option>
                                            <option value="in_progress">in_progress</option>
                                            <option value="completed">completed</option>
                                            <option value="cancelled">cancelled</option>
                                        </select>

                                        <label style={{ marginTop: 10 }}>Set quote (€)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 49.00"
                                            value={quoteEurosById[b.id] ?? ""}
                                            onChange={(e) =>
                                                setQuoteEurosById((s) => ({ ...s, [b.id]: e.target.value }))
                                            }
                                        />

                                        <button
                                            onClick={() => updateBooking(b.id)}
                                            disabled={savingId === b.id}
                                            style={{ marginTop: 10 }}
                                        >
                                            {savingId === b.id ? "Saving..." : "Save update"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
