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

function norm(s) {
    return String(s || "").toLowerCase().trim();
}

export default function AdminDashboard() {
    const { user } = useAuth();

    const [bookings, setBookings] = useState([]);
    const [techs, setTechs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // filters
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [assignFilter, setAssignFilter] = useState("all"); // all | assigned | unassigned
    const [techFilter, setTechFilter] = useState(""); // technician id as string

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

    const filtered = useMemo(() => {
        const query = norm(q);

        return bookings.filter((b) => {
            const status = b.status || "requested";
            const assigned = Boolean(b.technician_id);

            // status filter
            if (statusFilter && status !== statusFilter) return false;

            // assigned filter
            if (assignFilter === "assigned" && !assigned) return false;
            if (assignFilter === "unassigned" && assigned) return false;

            // technician filter
            if (techFilter) {
                const tid = String(b.technician_id || "");
                if (tid !== String(techFilter)) return false;
            }

            // search query (id, service name, city, customer name/email)
            if (query) {
                const hay = [
                    b.id,
                    b.service?.name,
                    b.service?.city,
                    b.user?.name,
                    b.user?.email,
                    b.technician?.name,
                    b.technician?.email,
                    b.problem_description,
                    status,
                ]
                    .map((x) => norm(x))
                    .join(" | ");
                if (!hay.includes(query)) return false;
            }

            return true;
        });
    }, [bookings, q, statusFilter, assignFilter, techFilter]);

    const filteredStats = useMemo(() => {
        const counts = {
            total: filtered.length,
            requested: 0,
            quoted: 0,
            accepted: 0,
            in_progress: 0,
            completed: 0,
            cancelled: 0,
        };
        for (const b of filtered) {
            const s = b.status || "requested";
            if (counts[s] != null) counts[s]++;
        }
        return counts;
    }, [filtered]);

    async function save(id) {
        const technician_id =
            techById[id] === "" ? null : Number(techById[id] ?? "");
        const status = statusById[id] || null;

        const quoteEuros = quoteById[id];
        const quote_cents =
            quoteEuros === undefined ? undefined : toCents(quoteEuros);

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

    function clearFilters() {
        setQ("");
        setStatusFilter("");
        setAssignFilter("all");
        setTechFilter("");
    }

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
                    <div className="actions">
                        <button className="ghost" onClick={load}>
                            Refresh
                        </button>
                    </div>
                </div>

                {loading && <p>Loading...</p>}
                {error && <p className="error">{error}</p>}

                {!loading && !error && (
                    <>
                        {/* Overview stats (global) */}
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

                        {/* Filters */}
                        <div className="card" style={{ marginTop: 18 }}>
                            <div className="cardHeader">
                                <div>
                                    <h2 style={{ margin: 0 }}>Bookings</h2>
                                    <div className="subtle">
                                        Search + filters • Showing <b>{filtered.length}</b> of{" "}
                                        <b>{bookings.length}</b>
                                    </div>
                                </div>
                                <button className="ghost" onClick={clearFilters}>
                                    Clear filters
                                </button>
                            </div>

                            <div className="form" style={{ marginTop: 12 }}>
                                <div>
                                    <label>Search</label>
                                    <input
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        placeholder="Search by id, service, city, customer, technician…"
                                    />
                                </div>

                                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                                    <div>
                                        <label>Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
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
                                        <label>Assignment</label>
                                        <select
                                            value={assignFilter}
                                            onChange={(e) => setAssignFilter(e.target.value)}
                                        >
                                            <option value="all">All</option>
                                            <option value="assigned">Assigned</option>
                                            <option value="unassigned">Unassigned</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label>Technician</label>
                                        <select
                                            value={techFilter}
                                            onChange={(e) => setTechFilter(e.target.value)}
                                        >
                                            <option value="">All</option>
                                            {techs.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name ? `${t.name} (${t.email})` : t.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Filtered stats */}
                                <div className="row" style={{ marginTop: 2 }}>
                                    <div className="actions">
                                        <span className="badge requested">
                                            requested: {filteredStats.requested}
                                        </span>
                                        <span className="badge quoted">
                                            quoted: {filteredStats.quoted}
                                        </span>
                                        <span className="badge accepted">
                                            accepted: {filteredStats.accepted}
                                        </span>
                                        <span className="badge in_progress">
                                            in progress: {filteredStats.in_progress}
                                        </span>
                                        <span className="badge completed">
                                            completed: {filteredStats.completed}
                                        </span>
                                        <span className="badge cancelled">
                                            cancelled: {filteredStats.cancelled}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="spacer" />

                            {/* Booking cards */}
                            {filtered.length === 0 ? (
                                <p>No bookings match your filters.</p>
                            ) : (
                                <div className="grid">
                                    {filtered.map((b) => {
                                        const status = b.status || "requested";
                                        return (
                                            <div key={b.id} className="card">
                                                <div className="cardHeader">
                                                    <div>
                                                        <h3 style={{ marginBottom: 6 }}>
                                                            {b.service?.name || "Service"}{" "}
                                                            <span className="subtle">#{b.id}</span>
                                                        </h3>
                                                        <div className="subtle">
                                                            📍 {b.service?.city || "-"} • 👤{" "}
                                                            {b.user?.name || b.user?.email || "-"}
                                                        </div>
                                                    </div>

                                                    <span className={`badge ${status}`}>
                                                        {status.replace("_", " ")}
                                                    </span>
                                                </div>

                                                <div className="spacer" />

                                                <p>
                                                    <b>Tech:</b>{" "}
                                                    {b.technician?.name ||
                                                        b.technician?.email ||
                                                        "Not assigned"}
                                                </p>
                                                <p>
                                                    <b>Quote:</b> {money(b.quote_cents)}
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
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}