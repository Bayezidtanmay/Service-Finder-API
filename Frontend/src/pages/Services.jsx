import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Navbar from "../components/Navbar.jsx";

const money = (cents) => `€${(Number(cents || 0) / 100).toFixed(2)}`;

export default function Services() {
    const nav = useNavigate();

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

    const bookNow = (serviceId) => {
        nav(`/bookings/new?service_id=${serviceId}`);
    };

    return (
        <>
            <Navbar />

            <div className="container">
                <div className="row">
                    <h1>Services</h1>
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
                            <div className="cardHeader">
                                <div>
                                    <h3 style={{ marginBottom: 6 }}>{s.name}</h3>
                                    <div className="subtle">
                                        {s.city ? `📍 ${s.city}` : "📍 Location not set"}
                                    </div>
                                </div>

                                {"base_price_cents" in s && (
                                    <span className="badge quoted">
                                        {money(s.base_price_cents)}
                                    </span>
                                )}
                            </div>

                            <div className="spacer" />

                            <div className="row" style={{ marginTop: 12 }}>
                                <button className="primary" onClick={() => bookNow(s.id)}>
                                    Book now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}


