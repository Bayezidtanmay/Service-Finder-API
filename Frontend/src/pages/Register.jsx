import { useState } from "react";
import { api, setToken } from "../api";

export default function Register() {
    const [name, setName] = useState("New User");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("password123");
    const [error, setError] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const data = await api("/auth/register", {
                method: "POST",
                body: { name, email, password },
            });

            setToken(data.token);
            window.location.href = "/services";
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container">
            <h1>Register</h1>

            {error && <p className="error">{error}</p>}

            <form onSubmit={onSubmit} className="card">
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

                <button type="submit">Create account</button>
            </form>
        </div>
    );
}
