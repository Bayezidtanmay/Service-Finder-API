import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
    const nav = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        setBusy(true);
        try {
            await login(email, password);
            nav("/services");
        } catch (e) {
            setErr(e.message || "Login failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="container">
            <h1>Login</h1>

            <div className="card">
                <form onSubmit={onSubmit}>
                    <label>Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} />

                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {err && <p className="error">{err}</p>}

                    <button disabled={busy}>{busy ? "Logging in..." : "Login"}</button>
                </form>

                <p style={{ marginTop: 12, opacity: 0.8 }}>
                    No account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}

