import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuth";

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      // keep it simple for beginners
      console.error("Logout failed", err);
      navigate("/login");
    }
  };

  // Helper to pick dashboard path by role
  const dashboardPath = () => {
    if (!user) return "/login";
    if (user.role_id === 1) return "/dashboard/admin";
    if (user.role_id === 2) return "/dashboard/instructor";
    return "/dashboard/learner";
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand fw-bold" to={user ? dashboardPath() : "/"}>
          prowessityVLMS
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {!user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">
                    Sign up
                  </Link>
                </li>
              </>
            )}

            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to={dashboardPath()}>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-secondary btn-sm ms-2" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}