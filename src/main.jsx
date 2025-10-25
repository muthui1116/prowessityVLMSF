import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import LearnerDashboard from "./pages/LearnerDashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useAuthStore } from "./store/useAuth";

const Protected = ({ children, roleId }) => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" />;
  if (roleId && user.role_id !== roleId) return <Navigate to="/login" />;
  return children;
};

function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    // fetch session user on app load so navbar and routes know auth state
    fetchMe();
  }, []);

  return (
    // Use flex layout so footer stays at bottom when page is short
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard/admin"
              element={
                <Protected roleId={1}>
                  <AdminDashboard />
                </Protected>
              }
            />
            <Route
              path="/dashboard/instructor"
              element={
                <Protected roleId={2}>
                  <InstructorDashboard />
                </Protected>
              }
            />
            <Route
              path="/dashboard/learner"
              element={
                <Protected roleId={3}>
                  <LearnerDashboard />
                </Protected>
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<App />);