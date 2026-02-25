import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../api";
import Navbar from "../components/Navbar.jsx";
import Toast from "../components/Toast.jsx";

const money = (cents) =>
    cents == null ? "-" : `€${(Number(cents) / 100).toFixed(2)}`;

const norm = (s) => String(s || "").toLowerCase().trim();

export default function TechnicianBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // filters
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState(""); // "", requested, accepted...
    const [bucket, setBucket] = useState("all"); // all | unassigned | assigned
    const [sort, setSort] = useState("newest"); // newest | oldest

    // Local form state per booking
    const [quoteEurosById, setQuoteEurosById] = useState({});
    const [statusById, setStatusById] = useState({});
    const [savingId, setSavingId] = useState(null);

    // Toasts
    const [toasts, setToasts] = useState([]);
    const pushToast = useCallback((t) => {
        setToasts((prev) => [...prev, { id: crypto.randomUUID(), ...t }]);
    }, []);
    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

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
            if (!b.technician_id && (b.status || "requested") === "requested") {
                unassignedRequested.push(b);
            } else {
                assignedToMe.push(b);
            }
        }
        return { unassignedRequested, assignedToMe };
    }, [bookings]);

    const allForFiltering = useMemo(() => {
        if (bucket === "unassigned") return unassignedRequested;
        if (bucket === "assigned") return assignedToMe;
        return bookings;
    }, [bucket, unassignedRequested, assignedToMe, bookings]);

    const filtered = useMemo(() => {
        const query = norm(q);

        let list = allForFiltering.filter((b) => {
            const status = b.status || "requested";

            if (statusFilter && status !== statusFilter) return false;

            if (query) {
                const hay = [
                    b.id,
                    b.service?.name,
                    b.service?.city,
                    b.user?.name,
                    b.user?.email,
                    b.problem_description,
                    status,
                ]
                    .map(norm)
                    .join(" | ");
                if (!hay.includes(query)) return false;
            }

            return true;
        });

        list = list.sort((a, b) => {
            const at = new Date(a.created_at || 0).getTime();
            const bt = new Date(b.created_at || 0).getTime();
            return sort === "oldest" ? at - bt : bt - at;
        });

        return list;
    }, [allForFiltering, q, statusFilter, sort]);

    async function acceptBooking(id) {
        try {
            setSavingId(id);
            await api(`/technician/bookings/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ action: "accept" }),
            });
            pushToast({ type: "success", title: "Accepted", message: `Booking #${id} accepted` });
            await load();
        } catch (e) {
            pushToast({ type: "error", title: "Failed", message: e.message || "Could not accept booking" });
        } finally {
            setSavingId(null);
        }
    }

    async function updateBooking(id) {
        const quoteEuros = quoteEurosById[id];
        const status = statusById[id];

        let quote_cents = null;
        if (quoteEuros !== undefined && quoteEuros !== "") {
            const n = Number(quoteEuros);
            if (Number.isNaN(n) || n < 0) {
                pushToast({ type: "error", title: "Invalid quote", message: "Quote must be a number (>= 0)" });
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
            pushToast({ type: "success", title: "Saved", message: `Booking #${id} updated` });
            await load();
        } catch (e) {
            pushToast({ type: "error", title: "Failed", message: e.message || "Could not update booking" });
        } finally {
            setSavingId(null);
        }
    }

    const clearFilters = () => {
        setQ("");
        setStatusFilter("");
        setBucket("all");
        setSort("newest");
    };

    const renderCard = (b, mode) => {
        const status = b.status || "requested";

        return (
            <div key={b.id} className="card">
                <div className="cardHeader">
                    <div>
                        <h3 style={{ marginBottom: 6 }}>
                            {b.service?.name || "Service"} <span className="subtle">#{b.id}</span>
                        </h3>
                        <div className="subtle">
                            📍 {b.service?.city || "-"} • 👤 {b.user?.name || b.user?.email || "-"}
                        </div>
                    </div>

                    <span className={`badge ${status}`}>
                        {status.replace("_", " ")}
                    </span>
                </div>

                <div className="spacer" />

                <p>
                    <b>Description:</b> {b.problem_description || "-"}
                </p>

                {mode === "unassigned" ? (
                    <div className="row" style={{ marginTop: 12 }}>
                        <button
                            className="primary"
                            onClick={() => acceptBooking(b.id)}
                            disabled={savingId === b.id}
                        >
                            {savingId === b.id ? "Accepting..." : "Accept"}
                        </button>
                    </div>
                ) : (
                    <>
                        <p>
                            <b>Current quote:</b> {money(b.quote_cents)}
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
                    </>
                )}
            </div>
        );
    };

    return (
        <>
            <Navbar />
            <Toast toasts={toasts} remove={removeToast} />

            <div className="container">
                <div className="row">
                    <h1>Technician Dashboard</h1>
                    <div className="actions">
                        <button className="ghost" onClick={load}>Refresh</button>
                        <button className="ghost" onClick={clearFilters}>Clear filters</button>
                    </div>
                </div>

                {loading && <p>Loading bookings...</p>}
                {error && <p className="error">{error}</p>}

                {!loading && !error && (
                    <>
                        {/* Filter bar */}
                        <div className="card" style={{ marginTop: 12 }}>
                            <div className="cardHeader">
                                <div>
                                    <h2 style={{ margin: 0 }}>Find bookings</h2>
                                    <div className="subtle">
                                        Showing <b>{filtered.length}</b> items
                                    </div>
                                </div>
                            </div>

                            <div className="form" style={{ marginTop: 12 }}>
                                <div>
                                    <label>Search</label>
                                    <input
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        placeholder="Search by service, city, customer, id…"
                                    />
                                </div>

                                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                                    <div>
                                        <label>Bucket</label>
                                        <select value={bucket} onChange={(e) => setBucket(e.target.value)}>
                                            <option value="all">All</option>
                                            <option value="unassigned">Unassigned requests</option>
                                            <option value="assigned">My assigned</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label>Status</label>
                                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                            <option value="">All</option>
                                            <option value="requested">requested</option>
                                            <option value="accepted">accepted</option>
                                            <option value="quoted">quoted</option>
                                            <option value="in_progress">in_progress</option>
                                            <option value="completed">completed</option>
                                            <option value="cancelled">cancelled</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label>Sort</label>
                                        <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                            <option value="newest">Newest first</option>
                                            <option value="oldest">Oldest first</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="actions">
                                    <span className="badge requested">unassigned: {unassignedRequested.length}</span>
                                    <span className="badge">assigned: {assignedToMe.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Results */}
                        {filtered.length === 0 ? (
                            <div className="card" style={{ marginTop: 16 }}>
                                <p>No bookings match your filters.</p>
                                <button className="ghost" onClick={clearFilters}>Clear filters</button>
                            </div>
                        ) : (
                            <div className="grid" style={{ marginTop: 16 }}>
                                {filtered.map((b) =>
                                    (!b.technician_id && (b.status || "requested") === "requested")
                                        ? renderCard(b, "unassigned")
                                        : renderCard(b, "assigned")
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
