import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./adminpanel.css";

export default function AdminPanel({ onLogout }) {
  const navigate = useNavigate();
  const [pcs, setPcs] = useState([]);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("layout");
  const [showMenu, setShowMenu] = useState(false);

  const API_BASE = "https://membrane-mate-fourth-disks.trycloudflare.com";
  const config = {
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json"
    }
  };

  // ✅ Fetch Layout & Requests automatically
  const fetchRealtimeData = async () => {
    try {
      const [pcsRes, requestsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/pcs`, config),
        axios.get(`${API_BASE}/admin/requests`, config),
      ]);
      setPcs(pcsRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error("Realtime fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch heavy history data only when the specific tab is opened
  const fetchTabHistory = async (tab) => {
    try {
      if (tab === "reports") {
        const reportsRes = await axios.get(`${API_BASE}/admin/reports`, config);
        setReports(reportsRes.data);
      } else if (tab === "attendance") {
        const attendanceRes = await axios.get(`${API_BASE}/admin/attendance`, config);
        setAttendance(attendanceRes.data);
      }
    } catch (error) {
      console.error(`Failed to fetch history for ${tab}:`, error);
    }
  };

  // ✅ Trigger real-time loop on load
  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 6000); 
    return () => clearInterval(interval);
  }, []);

  // ✅ Watch for tab switching to load heavy databases lazily
  useEffect(() => {
    if (selectedTab === "reports" || selectedTab === "attendance") {
      fetchTabHistory(selectedTab);
    }
  }, [selectedTab]);

  const handleRequestAction = async (requestId, action) => {
    try {
      await axios.post(`${API_BASE}/admin/handle-request`, { request_id: requestId, action }, config);
      fetchRealtimeData(); 
    } catch { alert("Failed to update request"); }
  };

  const handleForceCheckout = async (pcName) => {
    try {
      await axios.post(`${API_BASE}/admin/force-checkout`, { pc_name: pcName }, config);
      fetchRealtimeData(); 
    } catch { alert("Failed to force checkout"); }
  };

  const handleExportAttendance = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/export-attendance`, {
        ...config,
        responseType: "blob" 
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Maptiva_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export attendance. Make sure records exist and the server is running.");
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/Admin");
  };

  const handleTabSelect = (tab) => {
    setSelectedTab(tab);
    setShowMenu(false);
  };

  const tabTitles = {
    layout: "Desktop Layout",
    requests: "Permission Requests",
    reports: "Student Reports",
    attendance: "Attendance Logs"
  };

  if (loading) {
    return <div className="admin-loading">Loading admin panel...</div>;
  }

  return (
    <div className="admin-panel-container">

      {/* TOP BAR */}
      <div className="admin-top-bar">
        <h1 className="admin-title">MAPTIVA</h1>
        <div className="admin-top-right">
          {selectedTab === "attendance" && (
            <button className="export-btn" onClick={handleExportAttendance}>
              Export Excel
            </button>
          )}
          <div
            className="hamburger"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            ☰
          </div>
        </div>
      </div>

      {/* TAB TITLE */}
      <div className="admin-tab-title">
        <h2>{tabTitles[selectedTab]}</h2>
      </div>

      {/* OVERLAY */}
      {showMenu && (
        <div
          className="drawer-overlay"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* SLIDE-IN DRAWER */}
      <div className={`admin-drawer ${showMenu ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-avatar">A</div>
          <div>
            <p className="drawer-name">Admin</p>
            <p className="drawer-id">Administrator</p>
          </div>
          <div
            className="drawer-close"
            onClick={() => setShowMenu(false)}
          >
            ☰
          </div>
        </div>

        <hr className="drawer-divider" />

        <p className="drawer-label">Navigation</p>

        <div
          className={`drawer-item ${selectedTab === "layout" ? "active" : ""}`}
          onClick={() => handleTabSelect("layout")}
        >
          🖥 Desktop Layout
        </div>
        <div
          className={`drawer-item ${selectedTab === "requests" ? "active" : ""}`}
          onClick={() => handleTabSelect("requests")}
        >
          ✅ Requests
        </div>
        <div
          className={`drawer-item ${selectedTab === "reports" ? "active" : ""}`}
          onClick={() => handleTabSelect("reports")}
        >
          📄 Reports
        </div>
        <div
          className={`drawer-item ${selectedTab === "attendance" ? "active" : ""}`}
          onClick={() => handleTabSelect("attendance")}
        >
          📅 Attendance
        </div>

        <hr className="drawer-divider" />

        <div className="drawer-item drawer-signout" onClick={handleLogout}>
          🚪 Sign Out
        </div>
      </div>

      {/* CONTENT */}
      <div className="admin-content">

        {selectedTab === "layout" && (
          <div className="pc-grid">
            {pcs.map((pc) => (
              <div key={pc.id} className={`pc-card ${pc.status === "available" ? "available" : "occupied"}`}>
                <h3>{pc.pc_name}</h3>
                <p>
                  <span className={`status-dot ${pc.status}`}></span>
                  {pc.status}
                </p>
                {pc.student && (
                  <>
                    <p style={{ color: "white" }}>{pc.student.name}</p>
                    <p>{pc.student.student_id}</p>
                  </>
                )}
                {pc.status !== "available" && (
                  <button className="force-btn" onClick={() => handleForceCheckout(pc.pc_name)}>
                    FORCE CHECKOUT
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ✅ WRAPPED IN SCROLL WRAPPER */}
        {selectedTab === "requests" && (
          <div className="admin-scroll-wrapper">
            {requests.length === 0 ? (
              <p className="empty-msg">No pending requests.</p>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="admin-card">
                  <p><strong>{req.student_name}</strong> requests access to <strong>{req.pc_name}</strong></p>
                  <p className="status-text">Status: {req.status}</p>
                  {req.status === "pending" && (
                    <div className="request-actions">
                      <button className="btn-accept" onClick={() => handleRequestAction(req.id, "accepted")}>Accept</button>
                      <button className="btn-decline" onClick={() => handleRequestAction(req.id, "declined")}>Decline</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ✅ WRAPPED IN SCROLL WRAPPER */}
        {selectedTab === "reports" && (
          <div className="admin-scroll-wrapper">
            {reports.length === 0 ? (
              <p className="empty-msg">No reports submitted.</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="admin-card">
                  <p><strong>{report.student_name}</strong></p>
                  <p>{report.message}</p>
                  <small>{report.created_at}</small>
                </div>
              ))
            )}
          </div>
        )}

        {/* ✅ WRAPPED IN SCROLL WRAPPER */}
        {selectedTab === "attendance" && (
          <div className="admin-scroll-wrapper">
            {attendance.length === 0 ? (
              <p className="empty-msg">No attendance records yet.</p>
            ) : (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>PC</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>{r.student_id}</td>
                      <td>{r.pc_name}</td>
                      <td>{r.time_in}</td>
                      <td>{r.time_out}</td>
                      <td>
                        <span className={`status-badge ${r.status}`}>
                          {r.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
}