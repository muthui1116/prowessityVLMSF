import React, { useState } from "react";
import axios from "../api/axiosClient";
import { useAuthStore } from "../store/useAuth";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/signup", { username, email, password, confirmPassword });
      setUser(res.data.user);
      if (res.data.user.role_id === 1) navigate("/dashboard/admin");
      else if (res.data.user.role_id === 2) navigate("/dashboard/instructor");
      else navigate("/dashboard/learner");
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-3">Sign up</h3>
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <div className="d-grid gap-2">
                  <button className="btn btn-primary" type="submit">Sign up</button>
                </div>
              </form>
              <div className="mt-3">
                <a href="/login">Already have an account?</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}