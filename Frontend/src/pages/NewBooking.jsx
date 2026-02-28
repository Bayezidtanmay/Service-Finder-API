import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";

export default function NewBooking() {
    const nav = useNavigate();
    const [params] = useSearchParams();
    const serviceId = params.get("service_id");

    const [service, setService] = useState(null);
    const [requestedTime, setRequestedTime] = useState("");
    const [problemDescription, setProblemDescription] = useState("");

    // NEW: file state
    const [photoFile, setPhotoFile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadService() {
            try {
                setLoading(true);
                setError("");

                const services = await api("/services");
                const found = (Array.isArray(services) ? services : []).find(
                    (s) => String(s.id) === String(serviceId)
                );
                setService(found || null);
            } catch (e) {
                setError(e?.message || "Failed to load service");
            } finally {
                setLoading(false);
            }
        }

        if (serviceId) loadService();
        else {
            setLoading(false);
            setError("Missing service_id in URL");
        }
    }, [serviceId]);

    async function submit(e) {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const fd = new FormData();
            fd.append("service_id", serviceId);
            if (requestedTime) fd.append("requested_time", requestedTime);
            if (problemDescription) fd.append("problem_description", problemDescription);
            if (photoFile) fd.append("problem_photo", photoFile);

            await api("/bookings", {
                method: "POST",
                body: fd, // IMPORTANT: FormData
            });

            nav("/bookings/me");
        } catch (e) {
            setError(e?.message || "Failed to create booking");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="container">
            <div className="row">
                <h1>New Booking</h1>
                <button className="ghost" onClick={() => nav("/services")}>
                    Back
                </button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && (
                <div className="card">
                    <h2 style={{ marginTop: 0 }}>
                        {service?.name || "Service"}{" "}
                        <span className="subtle">{service?.city ? `• ${service.city}` : ""}</span>
                    </h2>

                    <form onSubmit={submit} className="form">
                        <div>
                            <label>Requested time (optional)</label>
                            <input
                                type="datetime-local"
                                value={requestedTime}
                                onChange={(e) => setRequestedTime(e.target.value)}
                            />
                        </div>

                        <div>
                            <label>Problem description</label>
                            <input
                                value={problemDescription}
                                onChange={(e) => setProblemDescription(e.target.value)}
                                placeholder="Describe the issue"
                            />
                        </div>

                        <div>
                            <label>Problem photo (optional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            />
                            {photoFile && (
                                <div className="subtle" style={{ marginTop: 6 }}>
                                    Selected: <b>{photoFile.name}</b>
                                </div>
                            )}
                        </div>

                        <button className="primary" disabled={saving}>
                            {saving ? "Creating..." : "Create booking"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}


