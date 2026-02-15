import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import "./styles.css";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Services from "./pages/Services.jsx";

function NotFound() {
  return (
    <div className="container">
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/services">Go to Services</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="container" style={{ marginTop: 20 }}>
        <nav className="row">
          <Link to="/services" style={{ color: "white" }}>Services</Link>
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/login" style={{ color: "white" }}>Login</Link>
            <Link to="/register" style={{ color: "white" }}>Register</Link>
          </div>
        </nav>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/services" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/services" element={<Services />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

