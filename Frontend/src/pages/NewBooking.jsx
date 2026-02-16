import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function NewBooking() {
    const nav = useNavigate();

    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);

    const [serviceId, setServiceId] = useState("");
    const [requestedTime, setRequestedTime] = useState("");
    const [problemDescription, setProblemDescription] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    useEffect(() => {
        (async () => {
            try {
                setLoadingServices(true);
                const data = await api("/services");
                setServices(Array.isArray(data) ? data : []);
            } catch (e) {
                setError(e.message || "Failed to load services");
            } finally {
                setLoadingServices(false);
            }
        })();
    }, []);

    const canSubmit = useMemo(() => {
        return (
            !!serviceId &&
            !!requestedTime &&
            problemDescription.trim().length >= 5 &&
            !submitting
        );
    }, [serviceId, requestedTime, problemDescription, submitting]);

    async function submit(e) {
        e.preventDefault();
        setError("");
        setOk("");

        if (!serviceId) return setError("Please select a service.");
        if (!requestedTime) return setError("Please select requested time.");
        if (problemDescription.trim().length < 5)
            return setError("Please describe the problem (at least 5 characters).");

        try {
            setSubmitting(true);

            // Backend usually expects: service_id, requested_time, problem_description
            const payload = {
                service_id: Number(serviceId),
                requested_time: requestedTime, // "YYYY-MM-DDTHH:mm"
                problem_description: problemDescription.trim(),
            };

            const created = await api("/bookings", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            setOk("Booking created ✅");

            // Optional: go to “My bookings” page later when we build it
            // For now redirect back to services after 800ms
            setTimeout(() => nav("/services"), 800);

            return created;
        } catch (e) {
            setError(e.message || "Booking failed");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="container">
            <div className="row">
                <h1>New Booking</h1>
                <button onClick={() => nav("/services")}>Back</button>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
                {error && <p className="error">{error}</p>}
                {ok && <p style={{ color: "#7CFC9A" }}>{ok}</p>}

                <form onSubmit={submit}>
                    <label>
                        <b>Service</b>
                    </label>

                    {loadingServices ? (
                        <p>Loading services...</p>
                    ) : (
                        <select
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value)}
                            style={{
                                width: "100%",
                                padding: 10,
                                margin: "6px 0 12px",
                                borderRadius: 8,
                                border: "1px solid #333",
                                background: "#0f1115",
                                color: "#fff",
                            }}
                        >
                            <option value="">-- Select a service --</option>
                            {services.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.city}) - €{(s.base_price_cents / 100).toFixed(2)}
                                </option>
                            ))}
                        </select>
                    )}

                    <label>
                        <b>Requested time</b>
                    </label>
                    <input
                        type="datetime-local"
                        value={requestedTime}
                        onChange={(e) => setRequestedTime(e.target.value)}
                    />

                    <label>
                        <b>Problem description</b>
                    </label>
                    <input
                        placeholder="e.g. Laptop not charging, fan noise..."
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                    />

                    <button type="submit" disabled={!canSubmit}>
                        {submitting ? "Creating..." : "Create booking"}
                    </button>
                </form>
            </div>
        </div>
    );
}
