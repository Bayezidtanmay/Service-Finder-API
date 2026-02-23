import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

const money = (cents) =>
    cents == null ? "-" : `€${(Number(cents) / 100).toFixed(2)}`;

function toCents(euros) {
    if (euros === "" || euros == null) return null;
    const n = Number(euros);
    if (Number.isNaN(n) || n < 0) return null;
    return Math.round(n * 100);
}

export default function AdminDashboard() {
    const { user } = useAuth();

    const [bookings, setBookings] = useState([]);
    const [techs, setTechs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // local edits per booking
    const [techById, setTechById] = useState({});
    const [statusById, setStatusById] = useState({});
    const [quoteById, setQuoteById] = useState({});
    const [savingId, setSavingId] = useState(null);

    async function load() {
        try {
            setLoading(true);
            setError("");

            const [b, t] = await Promise.all([
                api("/admin/bookings"),
                api("/admin/technicians"),
            ]);

            setBookings(Array.isArray(b) ? b : []);
            setTechs(Array.isArray(t) ? t : []);
        } catch (e) {
            setError(e?.message || "Failed to load admin dashboard data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const stats = useMemo(() => {
        const counts = {
            total: bookings.length,
            requested: 0,
            quoted: 0,
            accepted: 0,
            in_progress: 0,
            completed: 0,
            cancelled: 0,
        };

        for (const b of bookings) {
            const s = b.status || "requested";
            if (counts[s] != null) counts[s]++;
        }

        return counts;
    }, [bookings]);

    async function save(id) {
        const technician_id = techById[id] === "" ? null : Number(techById[id] ?? "");
        const status = statusById[id] || null;

        const quoteEuros = quoteById[id];
        const quote_cents =
            quoteEuros === undefined ? undefined : toCents(quoteEuros);

        // Build payload only with fields user touched
        const payload = {};
        if (techById[id] !== undefined) payload.technician_id = technician_id;
        if (statusById[id] !== undefined) payload.status = status;
        if (quoteById[id] !== undefined) payload.quote_cents = quote_cents;

        try {
            setSavingId(id);
            await api(`/admin/bookings/${id}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });
            await load();
        } catch (e) {
            alert(e?.message || "Failed to update booking");
        } finally {
            setSavingId(null);
        }
    }

    // Role guard (UI only)
    if (user?.role !== "admin") {
        return (
            <>
                <Navbar />
                <div className="container">
                    <div className="card">
                        <h2>Admin only</h2>
                        <p className="subtle">
                            Your account role is <b>{user?.role || "unknown"}</b>.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <div className="container">
                <div className="row">
                    <h1>Admin Dashboard</h1>
                </div>

                {loading && <p>Loading...</p>}
                {error && <p className="error">{error}</p>}

                {!loading && !error && (
                    <>
                        {/* Stats */}
                        <div className="grid" style={{ marginTop: 0 }}>
                            <div className="card">
                                <div className="subtle">Total bookings</div>
                                <h2 style={{ margin: "10px 0 0" }}>{stats.total}</h2>
                            </div>
                            <div className="card">
                                <div className="subtle">Requested</div>
                                <h2 style={{ margin: "10px 0 0" }}>{stats.requested}</h2>
                            </div>
                            <div className="card">
                                <div className="subtle">In progress</div>
                                <h2 style={{ margin: "10px 0 0" }}>{stats.in_progress}</h2>
                            </div>
                        </div>

                        <div className="grid">
                            <div className="card">
                                <div className="subtle">Quoted</div>
                                <h2 style={{ margin: "10px 0 0" }}>{stats.quoted}</h2>
                            </div>
                            <div className="card">
                                <div className="subtle">Completed</div>
                                <h2 style={{ margin: "10px 0 0" }}>{stats.completed}</h2>
                            </div>
                            <div className="card">
                                <div className="subtle">Cancelled</div>
                                <h2 style={{ margin: "10px 0 0" }}>{stats.cancelled}</h2>
                            </div>
                        </div>

                        {/* Booking list */}
                        <div className="card" style={{ marginTop: 18 }}>
                            <div className="cardHeader">
                                <div>
                                    <h2 style={{ margin: 0 }}>All bookings</h2>
                                    <div className="subtle">
                                        Assign technician, set quote, update status
                                    </div>
                                </div>
                                <button className="ghost" onClick={load}>
                                    Refresh
                                </button>
                            </div>

                            <div className="spacer" />

                            {bookings.length === 0 ? (
                                <p>No bookings yet.</p>
                            ) : (
                                <div className="grid">
                                    {bookings.map((b) => (
                                        <div key={b.id} className="card">
                                            <div className="cardHeader">
                                                <div>
                                                    <h3 style={{ marginBottom: 6 }}>
                                                        {b.service?.name || "Service"}
                                                    </h3>
                                                    <div className="subtle">
                                                        📍 {b.service?.city || "-"} • 👤{" "}
                                                        {b.user?.name || b.user?.email || "-"}
                                                    </div>
                                                </div>

                                                <span className={`badge ${b.status || "requested"}`}>
                                                    {(b.status || "requested").replace("_", " ")}
                                                </span>
                                            </div>

                                            <div className="spacer" />

                                            <p>
                                                <b>Current tech:</b>{" "}
                                                {b.technician?.name ||
                                                    b.technician?.email ||
                                                    "Not assigned"}
                                            </p>
                                            <p>
                                                <b>Current quote:</b> {money(b.quote_cents)}
                                            </p>
                                            <p>
                                                <b>Problem:</b> {b.problem_description || "-"}
                                            </p>

                                            <div className="form">
                                                <div>
                                                    <label>Assign technician</label>
                                                    <select
                                                        value={techById[b.id] ?? (b.technician_id ?? "")}
                                                        onChange={(e) =>
                                                            setTechById((s) => ({
                                                                ...s,
                                                                [b.id]: e.target.value,
                                                            }))
                                                        }
                                                    >
                                                        <option value="">(unassigned)</option>
                                                        {techs.map((t) => (
                                                            <option key={t.id} value={t.id}>
                                                                {t.name ? `${t.name} (${t.email})` : t.email}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label>Update status</label>
                                                    <select
                                                        value={statusById[b.id] ?? ""}
                                                        onChange={(e) =>
                                                            setStatusById((s) => ({
                                                                ...s,
                                                                [b.id]: e.target.value,
                                                            }))
                                                        }
                                                    >
                                                        <option value="">(keep same)</option>
                                                        <option value="requested">requested</option>
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
                                                        value={quoteById[b.id] ?? ""}
                                                        onChange={(e) =>
                                                            setQuoteById((s) => ({
                                                                ...s,
                                                                [b.id]: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                    <div className="subtle">
                                                        Leave empty to keep unchanged
                                                    </div>
                                                </div>

                                                <button
                                                    className="primary"
                                                    onClick={() => save(b.id)}
                                                    disabled={savingId === b.id}
                                                >
                                                    {savingId === b.id ? "Saving..." : "Save changes"}
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