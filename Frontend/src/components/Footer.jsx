import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Footer() {
    const nav = useNavigate();
    const { user } = useAuth();
    const year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footerInner">
                <div className="footerLeft">
                    <div className="footerBrand">
                        <span className="footerDot" />
                        <span className="footerName">Service Finder</span>
                    </div>
                    <p className="footerText">
                        Smart booking platform for customers, technicians, and admins.
                    </p>
                </div>

                <div className="footerCenter">
                    <button className="footerLink" onClick={() => nav("/services")}>
                        Services
                    </button>
                    <button className="footerLink" onClick={() => nav("/bookings/me")}>
                        My Bookings
                    </button>
                    <button className="footerLink" onClick={() => nav("/profile")}>
                        Profile
                    </button>

                    <button
                        className="footerLink"
                        onClick={() => nav("/technician/bookings")}
                    >
                        Technician
                    </button>

                    {user?.role === "admin" && (
                        <>
                            <button className="footerLink" onClick={() => nav("/admin")}>
                                Admin
                            </button>
                            <button
                                className="footerLink"
                                onClick={() => nav("/admin/analytics")}
                            >
                                Analytics
                            </button>
                        </>
                    )}
                </div>

                <div className="footerRight">
                    <span className="footerTag">React</span>
                    <span className="footerTag">Laravel</span>
                    <span className="footerTag">Role Based</span>
                </div>
            </div>

            <div className="footerBottom">
                <span>© {year} Service Finder</span>
                <span>Crafted with React + Laravel</span>
            </div>
        </footer>
    );
}