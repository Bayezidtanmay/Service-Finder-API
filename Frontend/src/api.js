const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

/**
 * api("/services")
 * api("/auth/login", { method:"POST", body: JSON.stringify({...}) })
 * api("/bookings", { method:"POST", body: FormData })
 */
export async function api(path, options = {}) {
  const token = getToken();

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  // Start with base headers
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  // Only set JSON content-type if NOT sending FormData
  // (Browser must set multipart boundary automatically)
  if (!isFormData) {
    // If caller didn't set it already, set JSON default
    if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
  } else {
    // Ensure we don't accidentally send JSON content-type with FormData
    delete headers["Content-Type"];
  }

  // Add token if available
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Try to parse response
  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // Handle errors
  if (!res.ok) {
    const msg =
      (data && data.message) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

