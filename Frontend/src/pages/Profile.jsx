import { useEffect, useMemo, useState, useCallback } from "react";
import Navbar from "../components/Navbar.jsx";
import Toast from "../components/Toast.jsx";
import ImageModal from "../components/ImageModal.jsx";
import { api, apiForm } from "../api";
import { useAuth } from "../auth/AuthContext.jsx";

const API_ORIGIN = "http://127.0.0.1:8000";

export default function Profile() {
    const { user: authUser } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [bio, setBio] = useState("");

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // modal (full screen image)
    const [modalSrc, setModalSrc] = useState(null);

    // Toasts
    const [toasts, setToasts] = useState([]);
    const pushToast = useCallback((t) => {
        setToasts((prev) => [...prev, { id: crypto.randomUUID(), ...t }]);
    }, []);
    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const avatarUrl = useMemo(() => {
        if (!user?.avatar_url) return null;
        // backend returns "/storage/avatars/..."
        return `${API_ORIGIN}${user.avatar_url}`;
    }, [user]);

    async function load() {
        try {
            setLoading(true);
            const me = await api("/profile");
            setUser(me);
            setName(me?.name || "");
            setPhone(me?.phone || "");
            setCity(me?.city || "");
            setBio(me?.bio || "");
        } catch (e) {
            pushToast({ type: "error", title: "Failed", message: e.message || "Could not load profile" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function save() {
        try {
            setSaving(true);
            const updated = await api("/profile", {
                method: "PATCH",
                body: JSON.stringify({ name, phone, city, bio }),
            });
            setUser(updated);
            pushToast({ type: "success", title: "Saved", message: "Profile updated" });
        } catch (e) {
            pushToast({ type: "error", title: "Failed", message: e.message || "Could not save profile" });
        } finally {
            setSaving(false);
        }
    }

    async function onPickAvatar(file) {
        if (!file) return;

        try {
            setUploading(true);
            const fd = new FormData();
            fd.append("avatar", file);

            const updated = await apiForm("/profile/avatar", fd);
            setUser(updated);

            pushToast({ type: "success", title: "Uploaded", message: "Avatar updated" });
        } catch (e) {
            pushToast({ type: "error", title: "Upload failed", message: e.message || "Could not upload avatar" });
        } finally {
            setUploading(false);
        }
    }

    async function removeAvatar() {
        try {
            setUploading(true);
            const updated = await api("/profile/avatar", { method: "DELETE" });
            setUser(updated);
            pushToast({ type: "success", title: "Removed", message: "Avatar removed" });
        } catch (e) {
            pushToast({ type: "error", title: "Failed", message: e.message || "Could not remove avatar" });
        } finally {
            setUploading(false);
        }
    }

    return (
        <>
            <Navbar />
            <Toast toasts={toasts} remove={removeToast} />

            {modalSrc && <ImageModal src={modalSrc} onClose={() => setModalSrc(null)} />}

            <div className="container">
                <div className="row">
                    <h1>Profile</h1>
                    <div className="actions">
                        <button className="ghost" onClick={load} disabled={loading}>
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="grid" style={{ alignItems: "start" }}>
                        <div className="card">
                            <h2 style={{ marginTop: 0 }}>Account</h2>
                            <div className="subtle" style={{ marginBottom: 12 }}>
                                Logged in as <b>{authUser?.email}</b> • role: <b>{authUser?.role || "user"}</b>
                            </div>

                            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                <div
                                    style={{
                                        width: 88,
                                        height: 88,
                                        borderRadius: 18,
                                        background: "rgba(255,255,255,.06)",
                                        border: "1px solid rgba(255,255,255,.10)",
                                        overflow: "hidden",
                                        display: "grid",
                                        placeItems: "center",
                                        cursor: avatarUrl ? "zoom-in" : "default",
                                    }}
                                    onClick={() => avatarUrl && setModalSrc(avatarUrl)}
                                    title={avatarUrl ? "Click to view" : ""}
                                >
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div className="subtle" style={{ fontSize: 28 }}>
                                            {user?.name?.slice(0, 1)?.toUpperCase() || "U"}
                                        </div>
                                    )}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div className="subtle">Profile photo</div>
                                    <div className="row" style={{ marginTop: 10 }}>
                                        <label className="buttonLike primary" style={{ cursor: uploading ? "not-allowed" : "pointer" }}>
                                            {uploading ? "Uploading..." : "Upload avatar"}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: "none" }}
                                                disabled={uploading}
                                                onChange={(e) => onPickAvatar(e.target.files?.[0])}
                                            />
                                        </label>

                                        <button className="ghost" onClick={removeAvatar} disabled={uploading || !user?.avatar_url}>
                                            Remove
                                        </button>
                                    </div>

                                    <div className="subtle" style={{ marginTop: 10 }}>
                                        JPG/PNG up to 4MB.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h2 style={{ marginTop: 0 }}>Public info</h2>

                            <div className="form" style={{ marginTop: 12 }}>
                                <div>
                                    <label>Name</label>
                                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                                </div>

                                <div>
                                    <label>Phone</label>
                                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+358 ..." />
                                </div>

                                <div>
                                    <label>City</label>
                                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Helsinki" />
                                </div>

                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label>Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell something about yourself…"
                                        rows={4}
                                        style={{
                                            width: "100%",
                                            padding: 10,
                                            borderRadius: 12,
                                            border: "1px solid rgba(255,255,255,.10)",
                                            background: "rgba(15,17,21,.6)",
                                            color: "white",
                                            resize: "vertical",
                                        }}
                                    />
                                </div>

                                <div className="row" style={{ marginTop: 8 }}>
                                    <button className="primary" onClick={save} disabled={saving}>
                                        {saving ? "Saving..." : "Save profile"}
                                    </button>
                                </div>

                                <div className="subtle" style={{ marginTop: 10 }}>
                                    Changes are saved to your account and visible in admin/technician views (name/email).
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}