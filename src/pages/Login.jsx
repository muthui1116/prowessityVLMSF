import React, { useState, useEffect } from "react";
import axios from "../api/axiosClient";
import { useAuthStore } from "../store/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/login", { email, password });
      setUser(res.data.user);
      if (res.data.user.role_id === 1) navigate("/dashboard/admin");
      else if (res.data.user.role_id === 2) navigate("/dashboard/instructor");
      else navigate("/dashboard/learner");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  const google = () => {
    window.location.href = `${axios.defaults.baseURL}/auth/google`;
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-3">Sign in</h3>
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="d-grid gap-2">
                  <button className="btn btn-primary" type="submit">Sign in</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={google}>Sign in with Google</button>
                </div>
              </form>
              <div className="mt-3">
                <a href="/signup">Create account</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}