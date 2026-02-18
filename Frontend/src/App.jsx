import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Services from "./pages/Services.jsx";
import NewBooking from "./pages/NewBooking.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/services" replace />} />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/services"
        element={
          <Protected>
            <Services />
          </Protected>
        }
      />

      <Route
        path="/bookings/new"
        element={
          <Protected>
            <NewBooking />
          </Protected>
        }
      />

      <Route
        path="/bookings/me"
        element={
          <Protected>
            <MyBookings />
          </Protected>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<div className="container">Not Found</div>} />
    </Routes>
  );
}





