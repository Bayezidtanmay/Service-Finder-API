import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "../api";

const AuthCtx = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loadMe() {
        const token = getToken();
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const me = await api("/auth/me");
            setUser(me);
        } catch (e) {
            clearToken();
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMe();
    }, []);

    async function login(email, password) {
        const data = await api("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        if (data?.token) setToken(data.token);
        setUser(data?.user || null);

        return data;
    }

    async function register(name, email, password) {
        const data = await api("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
        });

        if (data?.token) setToken(data.token);
        setUser(data?.user || null);

        return data;
    }

    async function logout() {
        try {
            await api("/auth/logout", { method: "POST" });
        } catch { }
        clearToken();
        setUser(null);
    }

    return (
        <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthCtx.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthCtx);
    if (ctx === undefined) {
        throw new Error("useAuth() must be used inside <AuthProvider>");
    }
    return ctx;
}

