import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
    const nav = useNavigate();
    const { register } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        setBusy(true);
        try {
            await register(name, email, password);
            nav("/services");
        } catch (e) {
            setErr(e.message || "Register failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="container">
            <h1>Register</h1>

            <div className="card">
                <form onSubmit={onSubmit}>
                    <label>Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} />

                    <label>Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} />

                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {err && <p className="error">{err}</p>}

                    <button disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
                </form>

                <p style={{ marginTop: 12, opacity: 0.8 }}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

