import { useEffect, useState } from "react";
import { api, clearToken } from "../api";

export default function Services() {
    const [services, setServices] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        api("/services")
            .then(setServices)
            .catch((e) => setError(e.message));
    }, []);

    const logout = async () => {
        try {
            await api("/auth/logout", { method: "POST" });
        } catch { }
        clearToken();
        window.location.href = "/login";
    };

    return (
        <div className="container">
            <div className="row">
                <h1>Services</h1>
                <button onClick={logout}>Logout</button>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="grid">
                {services.map((s) => (
                    <div key={s.id} className="card">
                        <h3>{s.name}</h3>
                        <p><b>City:</b> {s.city}</p>
                        <p><b>Price:</b> €{(s.base_price_cents / 100).toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
