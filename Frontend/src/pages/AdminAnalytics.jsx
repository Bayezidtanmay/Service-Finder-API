import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext.jsx";

const money = (cents) =>
    cents == null ? "-" : `€${(Number(cents) / 100).toFixed(2)}`;

function normStatus(s) {
    return String(s || "requested");
}

function LineChart({ data, valueKey, label, height = 120 }) {
    const padding = 12;

    const points = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return [];
        const vals = data.map((d) => Number(d[valueKey] || 0));
        const max = Math.max(1, ...vals);
        const w = 520;
        const h = height;

        return vals.map((v, i) => {
            const x = padding + (i / Math.max(1, vals.length - 1)) * (w - padding * 2);
            const y = padding + (1 - v / max) * (h - padding * 2);
            return { x, y, v };
        });
    }, [data, valueKey, height]);

    const d = useMemo(() => {
        if (points.length === 0) return "";
        return points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
            .join(" ");
    }, [points]);

    const maxV = useMemo(() => {
        const vals = (data || []).map((d) => Number(d[valueKey] || 0));
        return Math.max(0, ...vals);
    }, [data, valueKey]);

    return (
        <div className="chartCard">
            <div className="chartTop">
                <div className="chartTitle">{label}</div>
                <div className="subtle">Max: {maxV}</div>
            </div>

            <svg viewBox="0 0 520 120" className="chartSvg" style={{ height }}>
                <line x1="12" y1="108" x2="508" y2="108" className="chartGrid" />
                <line x1="12" y1="12" x2="12" y2="108" className="chartGrid" />

                <path d={d} className="chartPath" />

                {points.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r="3" className="chartDot" />
                ))}
            </svg>
        </div>
    );
}

function BarChart({ items, height = 140, title }) {
    const max = useMemo(() => Math.max(1, ...items.map((x) => x.value || 0)), [items]);

    return (
        <div className="chartCard">
            <div className="chartTop">
                <div className="chartTitle">{title}</div>
                <div className="subtle">{items.length} items</div>
            </div>

            <div className="barWrap" style={{ height }}>
                {items.map((it) => (
                    <div key={it.label} className="barRow">
                        <div className="barLabel">{it.label}</div>
                        <div className="barTrack">
                            <div
                                className="barFill"
                                style={{ width: `${Math.round(((it.value || 0) / max) * 100)}%` }}
                            />
                        </div>
                        <div className="barValue">{it.value || 0}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function stars(avg) {
    const full = Math.round(avg || 0);
    return "★".repeat(full) + "☆".repeat(5 - full);
}

export default function AdminAnalytics() {
    const { user } = useAuth();

    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function load() {
        try {
            setLoading(true);
            setError("");
            const res = await api(`/admin/analytics?days=${days}`);
            setData(res);
        } catch (e) {
            setError(e?.message || "Failed to load analytics");
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [days]);

    const statusItems = useMemo(() => {
        const m = data?.status_counts || {};
        const statuses = ["requested", "accepted", "quoted", "in_progress", "completed", "cancelled"];
        return statuses.map((s) => ({
            label: s.replace("_", " "),
            value: Number(m[s] || 0),
            raw: s,
        }));
    }, [data]);

    const topServicesItems = useMemo(() => {
        return (data?.top_services || []).map((s) => ({
            label: s.name || `Service #${s.id}`,
            value: Number(s.bookings_count || 0),
        }));
    }, [data]);

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
                    <h1>Analytics</h1>

                    <div className="actions">
                        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                            <option value={7}>Last 7 days</option>
                            <option value={14}>Last 14 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>

                        <button className="ghost" onClick={load}>
                            Refresh
                        </button>
                    </div>
                </div>

                {loading && <p>Loading analytics…</p>}
                {error && <p className="error">{error}</p>}

                {!loading && !error && data && (
                    <>
                        <div className="grid" style={{ marginTop: 0 }}>
                            <div className="card">
                                <div className="subtle">Total bookings</div>
                                <h2 style={{ margin: "10px 0 0" }}>{data.kpi?.total_bookings ?? 0}</h2>
                            </div>
                            <div className="card">
                                <div className="subtle">Completion rate</div>
                                <h2 style={{ margin: "10px 0 0" }}>{data.kpi?.completion_rate ?? 0}%</h2>
                            </div>
                            <div className="card">
                                <div className="subtle">Avg quote</div>
                                <h2 style={{ margin: "10px 0 0" }}>{money(data.kpi?.avg_quote_cents)}</h2>
                            </div>
                        </div>

                        {/* ✅ New review KPI cards */}
                        <div className="grid" style={{ marginTop: 16 }}>
                            <div className="card">
                                <div className="subtle">Total reviews</div>
                                <h2 style={{ margin: "10px 0 0" }}>{data.review_stats?.total_reviews ?? 0}</h2>
                            </div>
                            <div className="card">
                                <div className="subtle">Average technician rating</div>
                                <h2 style={{ margin: "10px 0 0" }}>
                                    {data.review_stats?.avg_rating ?? 0} / 5
                                </h2>
                            </div>
                            <div className="card">
                                <div className="subtle">Rating stars</div>
                                <h2 style={{ margin: "10px 0 0", color: "#fbbf24" }}>
                                    {stars(data.review_stats?.avg_rating || 0)}
                                </h2>
                            </div>
                        </div>

                        <div className="grid" style={{ marginTop: 16 }}>
                            <LineChart
                                data={data.trend || []}
                                valueKey="total"
                                label={`Bookings / day (last ${data.days} days)`}
                                height={140}
                            />
                            <LineChart
                                data={(data.revenue || []).map((x) => ({
                                    ...x,
                                    revenue_eur: Math.round((Number(x.revenue_cents || 0) / 100) * 100) / 100,
                                }))}
                                valueKey="revenue_eur"
                                label="Revenue trend (completed quotes, €)"
                                height={140}
                            />
                        </div>

                        <div className="grid" style={{ marginTop: 16 }}>
                            <BarChart
                                title="Status distribution"
                                items={statusItems.map((x) => ({
                                    label: x.label,
                                    value: x.value,
                                }))}
                            />

                            <BarChart title="Top services (by bookings)" items={topServicesItems} />
                        </div>

                        {/* ✅ New technician ratings leaderboard */}
                        <div className="card" style={{ marginTop: 16 }}>
                            <div className="cardHeader">
                                <div>
                                    <h2 style={{ margin: 0 }}>Top Rated Technicians</h2>
                                    <div className="subtle">Based on submitted customer reviews</div>
                                </div>
                            </div>

                            {(data.top_technicians || []).length === 0 ? (
                                <p style={{ marginTop: 14 }}>No technician reviews yet.</p>
                            ) : (
                                <div className="grid" style={{ marginTop: 14 }}>
                                    {data.top_technicians.map((tech, idx) => (
                                        <div key={tech.id} className="card">
                                            <div className="cardHeader">
                                                <div>
                                                    <h3 style={{ marginBottom: 6 }}>
                                                        #{idx + 1} {tech.name || tech.email}
                                                    </h3>
                                                    <div className="subtle">{tech.email}</div>
                                                </div>

                                                <span className="badge accepted">
                                                    {tech.avg_rating} ★
                                                </span>
                                            </div>

                                            <div className="spacer" />

                                            <p>
                                                <b>Average rating:</b>{" "}
                                                <span style={{ color: "#fbbf24" }}>{stars(tech.avg_rating)}</span>
                                            </p>

                                            <p>
                                                <b>Reviews:</b> {tech.reviews_count}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="card" style={{ marginTop: 16 }}>
                            <div className="subtle">Status legend</div>
                            <div className="actions" style={{ flexWrap: "wrap", marginTop: 10 }}>
                                {statusItems.map((x) => (
                                    <span key={x.raw} className={`badge ${normStatus(x.raw)}`}>
                                        {x.label}: {x.value}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}