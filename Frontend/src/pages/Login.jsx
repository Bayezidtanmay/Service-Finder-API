import { useState } from "react";
import { api, setToken } from "../api";

export default function Login() {
    const [email, setEmail] = useState("admin@test.fi");
    const [password, setPassword] = useState("password123");
    const [error, setError] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const data = await api("/auth/login", {
                method: "POST",
                body: { email, password },
            });

            setToken(data.token);
            window.location.href = "/services";
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container">
            <h1>Login</h1>

            {error && <p className="error">{error}</p>}

            <form onSubmit={onSubmit} className="card">
                <label>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} />

                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit">Login</button>
            </form>
        </div>
    );
}
