import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";

const money = (cents) =>
    cents == null ? "-" : `€${(Number(cents) / 100).toFixed(2)}`;

export default function NewBooking() {
    const nav = useNavigate();
    const [params] = useSearchParams();

    const serviceId = useMemo(() => {
        const v = params.get("service_id");
        return v ? Number(v) : null;
    }, [params]);

    const [service, setService] = useState(null);
    const [loadingService, setLoadingService] = useState(true);

    const [requestedTime, setRequestedTime] = useState("");
    const [problemDescription, setProblemDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Load service info
    useEffect(() => {
        if (!serviceId) {
            setLoadingService(false);
            return;
        }

        (async () => {
            try {
                setLoadingService(true);
                const services = await api("/services");
                const found = services.find((s) => s.id === serviceId);
                setService(found || null);
            } catch (e) {
                setError("Failed to load service information");
            } finally {
                setLoadingService(false);
            }
        })();
    }, [serviceId]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!serviceId) {
            setError("Missing service. Please go back and select a service again.");
            return;
        }

        try {
            setSaving(true);

            await api("/bookings", {
                method: "POST",
                body: JSON.stringify({
                    service_id: serviceId,
                    requested_time: requestedTime || null,
                    problem_description: problemDescription || null,
                }),
            });

            nav("/bookings/me");
        } catch (err) {
            setError(err.message || "Booking failed");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="container">
            <div className="row">
                <h1>New Booking</h1>
                <button type="button" onClick={() => nav("/services")}>
                    Back
                </button>
            </div>

            {/* SERVICE INFO */}
            <div className="card">
                {loadingService && <p>Loading service…</p>}

                {!loadingService && service && (
                    <>
                        <h2 style={{ marginTop: 0 }}>{service.name}</h2>

                        {service.city && (
                            <p>
                                <b>City:</b> {service.city}
                            </p>
                        )}

                        {"base_price_cents" in service && (
                            <p>
                                <b>Base price:</b> {money(service.base_price_cents)}
                            </p>
                        )}
                    </>
                )}

                {!loadingService && !service && (
                    <p className="error">
                        Service not found. Please go back and select again.
                    </p>
                )}
            </div>

            {/* BOOKING FORM */}
            <div className="card" style={{ marginTop: 12 }}>
                {error && <p className="error">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <label>
                        <b>Requested time</b> (optional)
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
                        placeholder="Describe the issue (e.g. laptop not charging)"
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                    />

                    <button type="submit" disabled={saving}>
                        {saving ? "Creating..." : "Create booking"}
                    </button>
                </form>
            </div>
        </div>
    );
}


