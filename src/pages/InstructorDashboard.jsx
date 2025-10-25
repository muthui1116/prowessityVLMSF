import React, { useEffect, useState } from "react";
import axios from "../api/axiosClient";
import { useAuthStore } from "../store/useAuth";
import { useNavigate } from "react-router-dom";

export default function InstructorDashboard() {
  const [data, setData] = useState({ courses: [], learnersByCourse: {}, attendance: [], materials: [], submissions: [], classes: [] });
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState(null);
  const [assignedLearner, setAssignedLearner] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { learnerId: status }
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());
  const [attendanceAggregated, setAttendanceAggregated] = useState([]);
  const [progressValue, setProgressValue] = useState("");
  const [progressLearner, setProgressLearner] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [materialLink, setMaterialLink] = useState("");
  const [materialFile, setMaterialFile] = useState(null);
  const [materialAssignedLearner, setMaterialAssignedLearner] = useState("");
  // Class fields
  const [meetLink, setMeetLink] = useState("");
  const [classScheduledAt, setClassScheduledAt] = useState("");
  const [classAssignedLearner, setClassAssignedLearner] = useState("");

  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await axios.get("/instructor/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load instructor dashboard", err);
      // keep UI usable even if load fails
      setData({ courses: [], learnersByCourse: {}, attendance: [], materials: [], submissions: [], classes: [] });
    }
  };

  const createAssignment = async () => {
    if (!courseId) {
      alert("Select course");
      return;
    }
    const form = new FormData();
    form.append("course_id", courseId);
    form.append("title", title);
    form.append("description", desc);
    if (file) form.append("file", file);
    if (assignedLearner) form.append("assigned_learner_id", assignedLearner);
    try {
      await axios.post("/instructor/assignments", form, { headers: { "Content-Type": "multipart/form-data" } });
      setTitle("");
      setDesc("");
      setFile(null);
      setAssignedLearner("");
      load();
      alert("Assignment created");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create assignment");
    }
  };

  const createMaterial = async () => {
    if (!courseId) {
      alert("Select course");
      return;
    }
    const form = new FormData();
    form.append("course_id", courseId);
    form.append("title", materialTitle);
    form.append("description", materialDesc);
    form.append("link", materialLink || "");
    if (materialFile) form.append("file", materialFile);
    if (materialAssignedLearner) form.append("assigned_learner_id", materialAssignedLearner);
    try {
      await axios.post("/instructor/materials", form, { headers: { "Content-Type": "multipart/form-data" } });
      setMaterialTitle("");
      setMaterialDesc("");
      setMaterialLink("");
      setMaterialFile(null);
      setMaterialAssignedLearner("");
      load();
      alert("Material uploaded");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to upload material");
    }
  };

  const createClass = async () => {
    if (!courseId) {
      alert("Select course");
      return;
    }
    if (!meetLink) {
      alert("Please provide a Meet link (e.g. https://meet.google.com/xxx-xxxx-xxx)");
      return;
    }
    try {
      await axios.post("/instructor/classes", {
        course_id: courseId,
        learner_id: classAssignedLearner || null,
        meet_link: meetLink,
        scheduled_at: classScheduledAt || null
      });
      setMeetLink("");
      setClassScheduledAt("");
      setClassAssignedLearner("");
      load();
      alert("Class created");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create class");
    }
  };

  // Updated gradeSubmission to accept num/den or percent and send both raw & total
  const gradeSubmission = async (id) => {
    const input = prompt("Enter grade (e.g., 23/30 or numeric percent). For numeric, enter number 0-100.");
    if (!input) return;
    let gradePayload = {};
    const slash = input.split("/");
    if (slash.length === 2) {
      const num = parseFloat(slash[0]);
      const den = parseFloat(slash[1]);
      if (isNaN(num) || isNaN(den) || den <= 0) {
        alert("Invalid format. Use num/den (e.g., 23/30) or a numeric percent (e.g., 85).");
        return;
      }
      const percent = Math.round((num / den) * 100);
      gradePayload = { grade: percent, grade_raw: Math.round(num), grade_total: Math.round(den) };
    } else {
      const n = parseFloat(input);
      if (isNaN(n) || n < 0 || n > 100) {
        alert("Invalid numeric grade. Enter a number between 0 and 100.");
        return;
      }
      gradePayload = { grade: Math.round(n), grade_raw: Math.round(n), grade_total: 100 };
    }
    const feedback = prompt("Feedback (optional):") || "";
    try {
      await axios.post(`/instructor/submissions/${id}/grade`, { ...gradePayload, feedback });
      load();
      alert("Submission graded");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Grading failed");
    }
  };

  const handleAttendanceStatus = (learnerId, val) => {
    setAttendanceRecords((prev) => ({ ...prev, [learnerId]: val }));
  };

  const submitAttendance = async () => {
    if (!courseId) {
      alert("Select course first");
      return;
    }
    if (!attendanceDate) {
      alert("Select attendance date");
      return;
    }
    const learners = data.learnersByCourse[courseId] || [];
    const records = learners.map((l) => ({
      learner_id: l.learner_id,
      date: attendanceDate,
      status: attendanceRecords[l.learner_id] || "A"
    }));
    try {
      await axios.post("/instructor/attendance", { course_id: courseId, records });
      setAttendanceRecords({});
      load();
      alert("Attendance recorded");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to record attendance");
    }
  };

  const fetchAttendanceAggregated = async () => {
    try {
      const res = await axios.get(`/instructor/attendance?year=${attendanceYear}`);
      setAttendanceAggregated(res.data.rows || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load aggregated attendance");
    }
  };

  const setProgress = async () => {
    if (!courseId || !progressLearner) {
      alert("Select course and learner");
      return;
    }
    const p = parseInt(progressValue, 10);
    if (isNaN(p) || p < 0 || p > 100) {
      alert("Progress must be a number 0-100");
      return;
    }
    try {
      await axios.post(`/instructor/courses/${courseId}/progress`, { learner_id: progressLearner, progress: p });
      load();
      alert("Progress updated");
    } catch (err) {
      console.error(err);
      alert("Failed to update progress");
    }
  };

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Helper: find learner name by id across learnersByCourse
  const getLearnerName = (learnerId) => {
    if (!learnerId) return learnerId;
    const groups = data.learnersByCourse || {};
    for (const cid of Object.keys(groups)) {
      const arr = groups[cid] || [];
      const found = arr.find((l) => l.learner_id === learnerId);
      if (found) return found.username || found.email || learnerId;
    }
    // fallback to id if not found
    return learnerId;
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Instructor Dashboard</h2>
      </div>

      {/* Top row: three cards side-by-side */}
      <div className="row mb-4">
        {/* Create Assignment card */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title">Create Assignment</h6>
              <div className="mb-2">
                <select className="form-select form-select-sm" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  <option value="">Select Course</option>
                  {data.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="mb-2">
                <input className="form-control form-control-sm" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="mb-2">
                <input className="form-control form-control-sm" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <div className="mb-2 d-flex gap-2">
                <input className="form-control form-control-sm" type="file" onChange={(e) => setFile(e.target.files[0])} />
              </div>
              <div className="mb-2">
                <select className="form-select form-select-sm" value={assignedLearner} onChange={(e) => setAssignedLearner(e.target.value)}>
                  <option value="">Assign to (optional)</option>
                  {(data.learnersByCourse[courseId] || []).map((l) => (
                    <option key={l.learner_id} value={l.learner_id}>{l.username || l.email}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary btn-sm w-100" onClick={createAssignment}>Create Assignment</button>
            </div>
          </div>
        </div>

        {/* Upload Material card */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title">Upload Learning Material</h6>
              <div className="mb-2">
                <select className="form-select form-select-sm" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  <option value="">Select Course</option>
                  {data.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="mb-2"><input className="form-control form-control-sm" placeholder="Title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} /></div>
              <div className="mb-2"><input className="form-control form-control-sm" placeholder="Description" value={materialDesc} onChange={(e) => setMaterialDesc(e.target.value)} /></div>
              <div className="mb-2"><input className="form-control form-control-sm" placeholder="Link (YouTube, W3Schools...)" value={materialLink} onChange={(e) => setMaterialLink(e.target.value)} /></div>
              <div className="mb-2"><input className="form-control form-control-sm" type="file" onChange={(e) => setMaterialFile(e.target.files[0])} /></div>
              <div className="mb-2">
                <select className="form-select form-select-sm" value={materialAssignedLearner} onChange={(e) => setMaterialAssignedLearner(e.target.value)}>
                  <option value="">Assign to (optional)</option>
                  {(data.learnersByCourse[courseId] || []).map((l) => (
                    <option key={l.learner_id} value={l.learner_id}>{l.username || l.email}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary btn-sm w-100" onClick={createMaterial}>Upload Material</button>
            </div>
          </div>
        </div>

        {/* Create Class card */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title">Create Class (Google Meet)</h6>
              <div className="mb-2">
                <select className="form-select form-select-sm" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  <option value="">Select Course</option>
                  {data.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="mb-2"><input className="form-control form-control-sm" placeholder="Meet link (https://meet.google.com/...)" value={meetLink} onChange={(e) => setMeetLink(e.target.value)} /></div>
              <div className="mb-2"><input type="datetime-local" className="form-control form-control-sm" value={classScheduledAt} onChange={(e) => setClassScheduledAt(e.target.value)} /></div>
              <div className="mb-2">
                <select className="form-select form-select-sm" value={classAssignedLearner} onChange={(e) => setClassAssignedLearner(e.target.value)}>
                  <option value="">Assign to (optional)</option>
                  {(data.learnersByCourse[courseId] || []).map((l) => (
                    <option key={l.learner_id} value={l.learner_id}>{l.username || l.email}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary btn-sm w-100" onClick={createClass}>Create Class</button>
            </div>
          </div>
        </div>
      </div>

      {/* Below: tables for Materials, Submissions, Classes, and Attendance (compact, readable) */}

      {/* Materials table */}
      <h5>Materials (created by you)</h5>
      <div className="table-responsive mb-4">
        <table className="table table-hover table-sm">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Course</th>
              <th>Description</th>
              <th>Link</th>
              <th>Assigned</th>
              <th>File</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.materials.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted py-3">No materials uploaded</td></tr>
            ) : (
              data.materials.map((m) => (
                <tr key={m.id}>
                  <td>{m.title}</td>
                  <td>{m.course_title || "—"}</td>
                  <td className="small">{m.description || "—"}</td>
                  <td>{m.link ? <a href={m.link} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">Open</a> : <span className="text-muted">—</span>}</td>
                  <td className="small text-muted">{m.assigned_username || "All learners"}</td>
                  <td>{m.file_path ? <a href={`${axios.defaults.baseURL}/${m.file_path}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">Download</a> : <span className="text-muted">—</span>}</td>
                  <td className="small text-muted">{m.created_at ? new Date(m.created_at).toLocaleString() : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Submissions table */}
      <h5>Submissions</h5>
      <div className="table-responsive mb-4">
        <table className="table table-striped table-sm">
          <thead className="table-light">
            <tr>
              <th>Assignment</th>
              <th>Learner</th>
              <th>Submitted At</th>
              <th>File</th>
              <th>Grade</th>
              <th>Feedback</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.submissions.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted py-3">No submissions yet</td></tr>
            ) : (
              data.submissions.map((s) => (
                <tr key={s.id}>
                  <td>{s.assignment_title || s.assignment_id}</td>
                  <td className="small text-muted">{s.learner_id}</td>
                  <td className="small text-muted">{s.submitted_at}</td>
                  <td>{s.file_path ? <a href={`${axios.defaults.baseURL}/${s.file_path}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">Download</a> : <span className="text-muted">—</span>}</td>
                  <td>{s.grade != null ? `${s.grade}%` : "Not graded"}</td>
                  <td>{s.feedback ? <span className="small">{s.feedback}</span> : <span className="text-muted">—</span>}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => gradeSubmission(s.id)}>Grade</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Classes table */}
      <h5>Your Classes</h5>
      <div className="table-responsive mb-4">
        <table className="table table-sm">
          <thead className="table-light">
            <tr>
              <th>Course</th>
              <th>Scheduled</th>
              <th>Assigned</th>
              <th>Join</th>
            </tr>
          </thead>
          <tbody>
            {data.classes.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-muted py-3">No classes created yet</td></tr>
            ) : (
              data.classes.map((cl) => (
                <tr key={cl.id}>
                  <td>{cl.course_title || cl.course_id}</td>
                  <td className="small text-muted">{cl.scheduled_at ? new Date(cl.scheduled_at).toLocaleString() : "Not scheduled"}</td>
                  <td className="small text-muted">{cl.assigned_username || "All learners"}</td>
                  <td>{cl.meet_link ? <a className="btn btn-success btn-sm" href={cl.meet_link} target="_blank" rel="noreferrer">Join</a> : <span className="text-muted">—</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Attendance aggregated */}
      <h5>Attendance (aggregated)</h5>
      <div className="d-flex mb-2">
        <input type="number" className="form-control w-auto me-2" value={attendanceYear} onChange={(e) => setAttendanceYear(e.target.value)} />
        <button className="btn btn-outline-primary" onClick={fetchAttendanceAggregated}>Load Attendance</button>
      </div>
      <div className="table-responsive mb-5">
        <table className="table table-sm">
          <thead className="table-light">
            <tr>
              <th>Week Start</th>
              <th>Learner</th>
              <th>Status</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {attendanceAggregated.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-muted py-3">No aggregated attendance loaded</td></tr>
            ) : (
              attendanceAggregated.map((r, idx) => (
                <tr key={idx}>
                  <td>{new Date(r.week_start).toDateString()}</td>
                  <td className="small text-muted">{getLearnerName(r.learner_id)}</td>
                  <td>{r.status}</td>
                  <td>{r.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}