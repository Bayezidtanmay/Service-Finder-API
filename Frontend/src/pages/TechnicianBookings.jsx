import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Navbar from "../components/Navbar.jsx";

const money = (cents) =>
    cents == null ? "-" : `€${(Number(cents) / 100).toFixed(2)}`;

export default function TechnicianBookings() {
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

    const customerName = (b) => b.user?.name || b.user?.email || "-";
    const serviceName = (b) => b.service?.name || "Service";
    const serviceCity = (b) => b.service?.city || "-";

    return (
        <>
            <Navbar />

            <div className="container">
                <div className="row">
                    <h1>Technician Dashboard</h1>
                </div>

                {loading && <p>Loading bookings...</p>}
                {error && <p className="error">{error}</p>}

                {!loading && !error && (
                    <>
                        {/* Unassigned requests */}
                        <div className="card" style={{ marginTop: 16 }}>
                            <div className="cardHeader">
                                <div>
                                    <h2 style={{ margin: 0 }}>Unassigned Requests</h2>
                                    <div className="subtle">Bookings waiting for a technician to accept</div>
                                </div>
                                <span className="badge requested">
                                    {unassignedRequested.length} pending
                                </span>
                            </div>

                            <div className="spacer" />

                            {unassignedRequested.length === 0 ? (
                                <p>No unassigned requested bookings right now.</p>
                            ) : (
                                <div className="grid">
                                    {unassignedRequested.map((b) => (
                                        <div key={b.id} className="card">
                                            <div className="cardHeader">
                                                <div>
                                                    <h3 style={{ marginBottom: 6 }}>{serviceName(b)}</h3>
                                                    <div className="subtle">📍 {serviceCity(b)}</div>
                                                </div>
                                                <span className={`badge ${b.status}`}>
                                                    {String(b.status || "-").replace("_", " ")}
                                                </span>
                                            </div>

                                            <div className="spacer" />

                                            <p>
                                                <b>Customer:</b> {customerName(b)}
                                            </p>
                                            <p>
                                                <b>Description:</b> {b.problem_description || "-"}
                                            </p>

                                            <div className="row" style={{ marginTop: 12 }}>
                                                <button
                                                    className="primary"
                                                    onClick={() => acceptBooking(b.id)}
                                                    disabled={savingId === b.id}
                                                >
                                                    {savingId === b.id ? "Accepting..." : "Accept"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Assigned bookings */}
                        <div className="card" style={{ marginTop: 16 }}>
                            <div className="cardHeader">
                                <div>
                                    <h2 style={{ margin: 0 }}>My Assigned Bookings</h2>
                                    <div className="subtle">Update status and add a quote</div>
                                </div>
                                <span className="badge">{assignedToMe.length} items</span>
                            </div>

                            <div className="spacer" />

                            {assignedToMe.length === 0 ? (
                                <p>No assigned bookings yet.</p>
                            ) : (
                                <div className="grid">
                                    {assignedToMe.map((b) => (
                                        <div key={b.id} className="card">
                                            <div className="cardHeader">
                                                <div>
                                                    <h3 style={{ marginBottom: 6 }}>{serviceName(b)}</h3>
                                                    <div className="subtle">📍 {serviceCity(b)}</div>
                                                </div>

                                                <span className={`badge ${b.status}`}>
                                                    {String(b.status || "-").replace("_", " ")}
                                                </span>
                                            </div>

                                            <div className="spacer" />

                                            <p>
                                                <b>Customer:</b> {customerName(b)}
                                            </p>

                                            <p>
                                                <b>Current quote:</b> {money(b.quote_cents)}
                                            </p>

                                            <p>
                                                <b>Description:</b> {b.problem_description || "-"}
                                            </p>

                                            <div className="form">
                                                <div>
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
                                                </div>

                                                <div>
                                                    <label>Set quote (€)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="e.g. 49.00"
                                                        value={quoteEurosById[b.id] ?? ""}
                                                        onChange={(e) =>
                                                            setQuoteEurosById((s) => ({ ...s, [b.id]: e.target.value }))
                                                        }
                                                    />
                                                </div>

                                                <button
                                                    className="primary"
                                                    onClick={() => updateBooking(b.id)}
                                                    disabled={savingId === b.id}
                                                >
                                                    {savingId === b.id ? "Saving..." : "Save update"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
