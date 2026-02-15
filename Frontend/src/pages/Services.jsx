import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext.jsx";


const money = (cents) => `€${(Number(cents || 0) / 100).toFixed(2)}`;

export default function Services() {
    const { user, logout } = useAuth();

    const [services, setServices] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const data = await api("/services");
                if (!alive) return;
                setServices(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!alive) return;
                setError(e.message || "Request failed");
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        }

        load();

        return () => {
            alive = false;
        };
    }, []);

    return (
        <div className="container">
            <div className="row">
                <div>
                    <h1 style={{ margin: 0 }}>Services</h1>
                    {user && (
                        <div style={{ marginTop: 6, opacity: 0.8, fontSize: 14 }}>
                            Logged in as <b>{user.name}</b> ({user.email})
                        </div>
                    )}
                </div>

                <button onClick={logout}>Logout</button>
            </div>

            {loading && <p style={{ opacity: 0.8 }}>Loading services…</p>}

            {!loading && error && <p className="error">{error}</p>}

            {!loading && !error && services.length === 0 && (
                <div className="card">
                    <p style={{ margin: 0, opacity: 0.85 }}>
                        No services found yet.
                    </p>
                    <p style={{ marginTop: 8, opacity: 0.7 }}>
                        Tip: add some demo services in Laravel Tinker.
                    </p>
                </div>
            )}

            <div className="grid">
                {services.map((s) => (
                    <div key={s.id} className="card">
                        <h3 style={{ marginTop: 0 }}>{s.name}</h3>

                        {s.city && (
                            <p>
                                <b>City:</b> {s.city}
                            </p>
                        )}

                        <p>
                            <b>Price:</b> {money(s.base_price_cents)}
                        </p>

                        {s.description && (
                            <p style={{ opacity: 0.85 }}>{s.description}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

