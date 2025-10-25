// name=frontend/src/pages/LearnerDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "../api/axiosClient";
import { useAuthStore } from "../store/useAuth";
import { useNavigate } from "react-router-dom";

export default function LearnerDashboard() {
  const [data, setData] = useState({ assignments: [], submissions: [], materials: [], progress: [], classes: [] });
  const [file, setFile] = useState(null);
  const [assignmentId, setAssignmentId] = useState("");
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await axios.get("/learner/dashboard");
    setData(res.data);
  };

  const submitAssignment = async () => {
    if (!assignmentId) {
      alert("Select assignment");
      return;
    }
    if (!window.confirm("Are you sure you want to submit your assignment? Once submitted it cannot be changed.")) return;
    const form = new FormData();
    form.append("assignment_id", assignmentId);
    if (file) form.append("file", file);
    try {
      await axios.post("/learner/submissions", form, { headers: { "Content-Type": "multipart/form-data" } });
      load();
      alert("Assignment submitted");
    } catch (err) {
      alert(err.response?.data?.error || "Submission failed");
    }
  };

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Helper to render grade as raw/total if available, else percent, else Not graded
  const renderGrade = (s) => {
    if (s.grade_raw != null && s.grade_total != null) {
      return `${s.grade_raw}/${s.grade_total}`;
    }
    if (s.grade != null) {
      return `${s.grade}%`;
    }
    return "Not graded";
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Learner Dashboard</h2>
      </div>

      {/* Submit Assignment */}
      <div className="card mb-4">
        <div className="card-body">
          <h5>Submit Assignment</h5>
          <div className="row g-2">
            <div className="col-md-6">
              <select className="form-select" value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
                <option value="">Select assignment to submit</option>
                {data.assignments.map((a) => (
                  <option key={a.id} value={a.id}>{a.title} - Due: {a.due_date}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <input className="form-control" type="file" onChange={(e) => setFile(e.target.files[0])} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100" onClick={submitAssignment}>Submit</button>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions table */}
      <h5>Your Submissions</h5>
      <div className="table-responsive mb-4">
        <table className="table table-striped table-hover">
          <thead className="table-light">
            <tr>
              <th>Assignment</th>
              <th>Submitted At</th>
              <th>File</th>
              <th>Grade</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            {data.submissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">No submissions yet</td>
              </tr>
            ) : (
              data.submissions.map((s) => (
                <tr key={s.id}>
                  <td>{s.assignment_title || s.assignment_id}</td>
                  <td className="small text-muted">{s.submitted_at}</td>
                  <td>
                    {s.file_path ? (
                      <a href={`${axios.defaults.baseURL}/${s.file_path}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
                        Download
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{renderGrade(s)}</td>
                  <td>{s.feedback ? <span className="small">{s.feedback}</span> : <span className="text-muted">—</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Progress table */}
      <h5>Your Progress</h5>
      <div className="table-responsive mb-4">
        <table className="table table-sm table-bordered">
          <thead className="table-light">
            <tr>
              <th>Course</th>
              <th>Progress</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.progress.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-muted py-4">No progress records</td>
              </tr>
            ) : (
              data.progress.map((p) => (
                <tr key={p.course_id}>
                  <td>{p.course_title || p.course_id}</td>
                  <td>{p.progress}%</td>
                  <td className="small text-muted">{p.updated_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Materials table */}
      <h5>Materials</h5>
      <div className="table-responsive mb-4">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Course</th>
              <th>Description</th>
              <th>Link</th>
              <th>File</th>
              <th>Instructor</th>
            </tr>
          </thead>
          <tbody>
            {data.materials.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">No learning materials yet</td>
              </tr>
            ) : (
              data.materials.map((m) => (
                <tr key={m.id}>
                  <td>{m.title}</td>
                  <td>{m.course_title || "—"}</td>
                  <td className="small">{m.description || "—"}</td>
                  <td>
                    {m.link ? (
                      <a href={m.link} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">Open</a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {m.file_path ? (
                      <a href={`${axios.defaults.baseURL}/${m.file_path}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
                        Download
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="small text-muted">{m.instructor_name || "Unknown"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Classes table */}
      <h5>Classes</h5>
      <div className="table-responsive mb-4">
        <table className="table table-sm">
          <thead className="table-light">
            <tr>
              <th>Course</th>
              <th>Scheduled</th>
              <th>Instructor</th>
              <th>Join</th>
            </tr>
          </thead>
          <tbody>
            {data.classes.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">No upcoming classes</td>
              </tr>
            ) : (
              data.classes.map((cl) => (
                <tr key={cl.id}>
                  <td>{cl.course_title || cl.course_id}</td>
                  <td className="small text-muted">{cl.scheduled_at ? new Date(cl.scheduled_at).toLocaleString() : "Not scheduled"}</td>
                  <td className="small text-muted">{cl.instructor_name || "Unknown"}</td>
                  <td>
                    {cl.meet_link ? (
                      <a className="btn btn-success btn-sm" href={cl.meet_link} target="_blank" rel="noreferrer">Join class</a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}