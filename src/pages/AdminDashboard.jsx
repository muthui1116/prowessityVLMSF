import React, { useEffect, useState } from "react";
import axios from "../api/axiosClient";
import { useAuthStore } from "../store/useAuth";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [progress, setProgress] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "" }); // type: "success" | "danger" | "info"
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const showAlert = (message, type = "success", timeout = 4000) => {
    setAlert({ message, type });
    if (timeout) {
      setTimeout(() => setAlert({ message: "", type: "" }), timeout);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await axios.get("/admin/dashboard");
      setCourses(res.data.courses || []);
      setUsers(res.data.users || []);
      setProgress(res.data.progress || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load dashboard data", "danger");
    }
  };

  const createCourse = async () => {
    try {
      const res = await axios.post("/admin/courses", { title, description });
      setCourses([res.data.course, ...courses]);
      setTitle("");
      setDescription("");
      showAlert("Course created successfully", "success");
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.error || "Failed to create course", "danger");
    }
  };

  const assignInstructor = async (courseId, instructorId) => {
    try {
      await axios.post(`/admin/courses/${courseId}/assign-instructor`, { instructor_id: instructorId });
      showAlert("Instructor assigned to course", "success");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.error || "Failed to assign instructor", "danger");
    }
  };

  const assignLearner = async (courseId, learnerId) => {
    try {
      await axios.post(`/admin/courses/${courseId}/assign-learner`, { learner_id: learnerId });
      showAlert("Learner assigned to course", "success");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.error || "Failed to assign learner", "danger");
    }
  };

  const changeUserRole = async (userId, roleId) => {
    try {
      await axios.post(`/admin/users/${userId}/assign-role`, { role_id: roleId });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role_id: roleId } : u)));
      showAlert("User role updated", "success");
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.error || "Failed to update role", "danger");
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await axios.get(`/admin/attendance?year=${attendanceYear}`);
      setAttendanceRows(res.data.rows || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load attendance", "danger");
    }
  };

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Helpers to map ids -> human readable names (keep behavior intact if mapping not found)
  const getCourseTitle = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : courseId;
  };

  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? (user.username || user.email) : userId;
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Admin Dashboard</h2>
      </div>

      {/* Alert */}
      {alert.message && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setAlert({ message: "", type: "" })}></button>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h5>Create course</h5>
          <div className="row g-2">
            <div className="col-md-4">
              <input className="form-control" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="col-md-6">
              <input className="form-control" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100" onClick={createCourse}>Create</button>
            </div>
          </div>
        </div>
      </div>

      {/* Courses table */}
      <h5>Courses</h5>
      <div className="table-responsive mb-4">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th style={{ width: "220px" }}>Assign Instructor</th>
              <th style={{ width: "220px" }}>Assign Learner</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="align-middle">{c.title}</td>
                <td className="align-middle">{c.description}</td>
                <td className="align-middle">
                  <div className="d-flex">
                    <select id={`instr-${c.id}`} className="form-select form-select-sm me-2">
                      <option value="">Select Instructor</option>
                      {users
                        .filter((u) => u.role_id === 2)
                        .map((ins) => (
                          <option key={ins.id} value={ins.id}>
                            {ins.username || ins.email}
                          </option>
                        ))}
                    </select>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const val = document.getElementById(`instr-${c.id}`).value;
                        if (val) assignInstructor(c.id, val);
                        else showAlert("Please select an instructor", "info");
                      }}
                    >
                      Assign
                    </button>
                  </div>
                </td>
                <td className="align-middle">
                  <div className="d-flex">
                    <select id={`learner-${c.id}`} className="form-select form-select-sm me-2">
                      <option value="">Select Learner</option>
                      {users
                        .filter((u) => u.role_id === 3)
                        .map((ln) => (
                          <option key={ln.id} value={ln.id}>
                            {ln.username || ln.email}
                          </option>
                        ))}
                    </select>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const val = document.getElementById(`learner-${c.id}`).value;
                        if (val) assignLearner(c.id, val);
                        else showAlert("Please select a learner", "info");
                      }}
                    >
                      Assign
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">No courses available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="my-4" />

      {/* Users table */}
      <h5>Users</h5>
      <div className="table-responsive mb-4">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th style={{ width: "220px" }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username || u.email}</td>
                <td className="text-muted">{u.email}</td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={u.role_id}
                    onChange={(e) => {
                      const newRole = parseInt(e.target.value, 10);
                      if (newRole === u.role_id) {
                        showAlert("Role unchanged", "info");
                        return;
                      }
                      if (!window.confirm(`Change role of ${u.username || u.email} to ${newRole === 1 ? "Admin" : newRole === 2 ? "Instructor" : "Learner"}?`))
                        return;
                      changeUserRole(u.id, newRole);
                    }}
                  >
                    <option value={1}>Admin</option>
                    <option value={2}>Instructor</option>
                    <option value={3}>Learner</option>
                  </select>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted py-4">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="my-4" />

      <h5>Course Progress</h5>
      <div className="table-responsive mb-4">
        <table className="table table-sm table-striped">
          <thead className="table-light">
            <tr>
              <th>Course</th>
              <th>Learner</th>
              <th>Progress</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={`${p.course_id}-${p.learner_id}`}>
                <td>{p.course_title || p.course_id}</td>
                <td>{p.username || p.email}</td>
                <td>{p.progress}%</td>
                <td className="small text-muted">{p.updated_at}</td>
              </tr>
            ))}
            {progress.length === 0 && (
              <tr><td colSpan={4} className="text-center text-muted py-4">No progress records</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h5>Attendance (weekly aggregated)</h5>
      <div className="d-flex mb-2">
        <input type="number" className="form-control w-auto me-2" value={attendanceYear} onChange={(e) => setAttendanceYear(e.target.value)} />
        <button className="btn btn-outline-primary" onClick={loadAttendance}>Load Attendance</button>
      </div>
      <div className="table-responsive">
        <table className="table table-sm">
          <thead className="table-light">
            <tr>
              <th>Week Start</th>
              <th>Course</th>
              <th>Instructor</th>
              <th>Learner</th>
              <th>Status</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRows.map((r, idx) => (
              <tr key={idx}>
                <td>{new Date(r.week_start).toDateString()}</td>
                <td>{getCourseTitle(r.course_id)}</td>
                <td>{getUserName(r.instructor_id)}</td>
                <td>{getUserName(r.learner_id)}</td>
                <td>{r.status}</td>
                <td>{r.count}</td>
              </tr>
            ))}
            {attendanceRows.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted py-4">No attendance data loaded</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}