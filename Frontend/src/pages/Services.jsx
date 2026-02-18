import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext.jsx";

const money = (cents) => `€${(Number(cents || 0) / 100).toFixed(2)}`;

export default function Services() {
    const nav = useNavigate();
    const { logout } = useAuth();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadServices() {
        try {
            setError("");
            setLoading(true);
            const data = await api("/services"); // expects array
            setServices(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e?.message || "Request failed");
            setServices([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadServices();
    }, []);

    const handleLogout = async () => {
        await logout();
        nav("/login", { replace: true });
    };

    const bookNow = (serviceId) => {
        nav(`/bookings/new?service_id=${serviceId}`);
    };

    return (
        <div className="container">
            <div className="row">
                <h1>Services</h1>
                <button onClick={() => nav("/bookings/me")}>My bookings</button>
                <button onClick={() => nav("/bookings/new")}>Create booking</button>
                <button onClick={handleLogout}>Logout</button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && services.length === 0 && (
                <div className="card">
                    <p>No services found.</p>
                    <button onClick={loadServices}>Reload</button>
                </div>
            )}

            <div className="grid">
                {services.map((s) => (
                    <div key={s.id} className="card">
                        <h3>{s.name}</h3>

                        {s.city && (
                            <p>
                                <b>City:</b> {s.city}
                            </p>
                        )}

                        {"base_price_cents" in s && (
                            <p>
                                <b>Price:</b> {money(s.base_price_cents)}
                            </p>
                        )}

                        <div className="row" style={{ marginTop: 12 }}>
                            <button onClick={() => bookNow(s.id)}>Book now</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


