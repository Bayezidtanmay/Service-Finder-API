import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Services from "./pages/Services.jsx";
import NewBooking from "./pages/NewBooking.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import TechnicianBookings from "./pages/TechnicianBookings.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminAnalytics from "./pages/AdminAnalytics.jsx";
import Profile from "./pages/Profile.jsx";
import Footer from "./components/Footer.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <div className="appShell">
      <main className="appMain">
        <Routes>
          <Route path="/" element={<Navigate to="/services" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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

          <Route
            path="/technician/bookings"
            element={
              <Protected>
                <TechnicianBookings />
              </Protected>
            }
          />

          <Route
            path="/admin"
            element={
              <Protected>
                <AdminDashboard />
              </Protected>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <Protected>
                <AdminAnalytics />
              </Protected>
            }
          />

          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="*" element={<div className="container">Not Found</div>} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}






