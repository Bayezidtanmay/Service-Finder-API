import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Navbar() {
    const nav = useNavigate();
    const { user, logout } = useAuth();

    async function handleLogout() {
        await logout();
        nav("/login", { replace: true });
    }

    return (
        <div className="navWrap">
            <div className="navBar">
                <div className="navLeft">
                    <div className="brand" onClick={() => nav("/services")}>
                        <span className="brandDot" />
                        Service Finder
                    </div>

                    <nav className="navLinks">
                        <NavLink
                            to="/services"
                            className={({ isActive }) =>
                                "navLink" + (isActive ? " active" : "")
                            }
                        >
                            Services
                        </NavLink>

                        <NavLink
                            to="/bookings/me"
                            className={({ isActive }) =>
                                "navLink" + (isActive ? " active" : "")
                            }
                        >
                            My Bookings
                        </NavLink>

                        {user?.role === "technician" && (
                            <NavLink
                                to="/technician/bookings"
                                className={({ isActive }) =>
                                    "navLink" + (isActive ? " active" : "")
                                }
                            >
                                Technician
                            </NavLink>
                        )}

                        {user?.role === "admin" && (
                            <NavLink
                                to="/admin"
                                className={({ isActive }) => "navLink" + (isActive ? " active" : "")}
                            >
                                Admin
                            </NavLink>
                        )}
                    </nav>
                </div>

                <div className="navRight">
                    <div className="whoami">
                        <span className="whoDot" />
                        <span className="whoText">
                            {user?.name || "Account"} • {user?.role || "user"}
                        </span>
                    </div>

                    <button className="danger" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}