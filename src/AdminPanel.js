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

  // 🎛️ ADVANCED TIMELINE FILTER STATES
  const [showFilterTray, setShowFilterTray] = useState(false);
  const [filterDate, setFilterDate] = useState("All"); 
  const [filterTimeFrom, setFilterTimeFrom] = useState("00:00"); 
  const [filterTimeTo, setFilterTimeTo] = useState("23:59");
  const [filterStatus, setFilterStatus] = useState("All");

  const API_BASE = "https://nav-reflected-pic-blank.trycloudflare.com";
  const config = {
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json"
    }
  };

  // Helper to generate the rolling 7-day selector array using local timezone calculations
  const getFilterDateOptions = () => {
    const options = [{ label: "All Days", value: "All" }];
    
    for (let i = 0; i <= 6; i++) {
      const d = new Date();
      // Roll back day intervals safely by local calendar date units
      d.setDate(d.getDate() - i);
      
      // ✅ FIX: Extract local year, month, and day manually to prevent UTC timezone shifting
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`; // Always matches "YYYY-MM-DD" in local time
      
      let label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      if (i === 0) label += " (From Today)";
      if (i === 6) label += " (From Past 6 Days - Near Deletion)";

      options.push({ label, value: dateString });
    }
    return options;
  };

  const dateOptions = getFilterDateOptions();

  // ✅ Updated to cleanly include the active history datasets during re-polling passes
  const fetchRealtimeData = async () => {
    try {
      const [pcsRes, requestsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/pcs`, config),
        axios.get(`${API_BASE}/admin/requests`, config),
      ]);
      setPcs(pcsRes.data);
      setRequests(requestsRes.data);

      // If the admin is actively looking at these logs during an auto-refresh pass, update them too!
      if (selectedTab === "attendance") {
        const attendanceRes = await axios.get(`${API_BASE}/admin/attendance`, config);
        setAttendance(attendanceRes.data);
      } else if (selectedTab === "reports") {
        const reportsRes = await axios.get(`${API_BASE}/admin/reports`, config);
        setReports(reportsRes.data);
      }
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

  // ✅ Ensure re-fetch loop recognizes when tabs swap so it updates instantly
  useEffect(() => {
    if (selectedTab === "reports" || selectedTab === "attendance") {
      fetchTabHistory(selectedTab);
    }
  }, [selectedTab]);

  // ✅ Add selectedTab to your layout polling array so the loop can read the active state accurately
  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 6000); 
    return () => clearInterval(interval);
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

  // 📥 Context-Aware Excel Export matching current active filter selections
  const handleExportAttendance = async () => {
    try {
      const params = `?date=${filterDate}&time_from=${filterTimeFrom}&time_to=${filterTimeTo}&status=${filterStatus}`;
      const res = await axios.get(`${API_BASE}/admin/export-attendance${params}`, {
        ...config,
        responseType: "blob" 
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Filtered_Maptiva_Logs_${filterDate}.xlsx`);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export attendance. Make sure records exist for this filter setup.");
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

  // ⏳ Client-Side Live Filter Engine (Crash-Proof Edition)
  const filteredAttendance = attendance.filter((log) => {
    // 1. Filter by Status
    const matchesStatus = filterStatus === "All" || log.status === filterStatus;

    if (!log.time_in) return false;
    
    // Normalize string: convert "2026-06-25T14:30:00" or custom shapes safely into parts
    const normalizedTimestamp = log.time_in.replace("T", " "); 
    const parts = normalizedTimestamp.split(" ");
    const logDate = parts[0]; // Always yields "YYYY-MM-DD"
    const logTimePart = parts[1] || ""; // Yields "HH:MM:SS" or empty string
    
    // 2. Filter by Date
    const matchesDate = filterDate === "All" || logDate === filterDate;

    // 3. Filter by Time range (safely guards against undefined or blank data)
    const timeToMinutes = (tStr) => {
      // 🛡️ CRASH GUARD: If the string is missing, blank, or not a string, stop immediately
      if (!tStr || typeof tStr !== "string") return 0;
      
      // Check if string contains AM or PM safely
      const lowerStr = tStr.toLowerCase();
      const isAmPm = lowerStr.includes("am") || lowerStr.includes("pm");
      
      if (isAmPm) {
        // Handle AM/PM format (e.g., "10:15:00 AM")
        const timeParts = tStr.split(" ");
        if (!timeParts[0]) return 0;
        
        let [hours, minutes] = timeParts[0].split(":");
        const modifier = timeParts[1] ? timeParts[1].toLowerCase() : "am";
        
        hours = parseInt(hours, 10) || 0;
        minutes = parseInt(minutes, 10) || 0;

        if (modifier === "pm" && hours < 12) hours += 12;
        if (modifier === "am" && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      } else {
        // Handle standard 24-hour format (e.g., "14:30:00")
        const timeParts = tStr.split(":");
        const hours = parseInt(timeParts[0], 10) || 0;
        const minutes = parseInt(timeParts[1], 10) || 0;
        return hours * 60 + minutes;
      }
    };

    const logMinutes = timeToMinutes(logTimePart);
    const fromMinutes = timeToMinutes(filterTimeFrom);
    const toMinutes = timeToMinutes(filterTimeTo);
    const matchesTime = logMinutes >= fromMinutes && logMinutes <= toMinutes;

    return matchesStatus && matchesDate && matchesTime;
  });

  if (loading) {
    return <div className="admin-loading">Loading admin panel...</div>;
  }

  return (
    <div className="admin-panel-container">

      {/* TOP BAR */}
      <div className="admin-top-bar">
        <h1 className="admin-title">MAPTIVA</h1>
        <div className="admin-top-right">
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

        {/* ✅ UPDATED ATTENDANCE VIEW WITH EXPANDABLE TRAY */}
        {selectedTab === "attendance" && (
          <div className="admin-scroll-wrapper">
            
            {/* ACTION BANNER HUB */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <span style={{ color: "#aaa", fontSize: "14px" }}>
                Showing {filteredAttendance.length} of {attendance.length} records
                {attendance.length > 0 && ` (Sample DB Time Format: "${attendance[0].time_in}")`}
              </span>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="export-btn" 
                  onClick={handleExportAttendance}
                  style={{ background: "#28a745", border: "none" }}
                >
                  📥 Export Current View
                </button>

                <button 
                  onClick={() => setShowFilterTray(!showFilterTray)}
                  style={{
                    background: showFilterTray ? "#007bff" : "#222",
                    color: "#fff",
                    border: "1px solid #444",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  🔍 {showFilterTray ? "Hide Filters" : "Filter Logs"}
                </button>
              </div>
            </div>

            {/* EXPANDABLE FILTER CONTAINER TRAY */}
            {showFilterTray && (
              <div className="filter-tray" style={{ 
                background: "#181818", 
                border: "1px solid #333", 
                borderRadius: "6px", 
                padding: "15px", 
                marginBottom: "20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px"
              }}>
                {/* 1. Date Option Element */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ color: "#aaa", fontSize: "12px" }}>Date Frame</label>
                  <select 
                    value={filterDate} 
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={{ padding: "8px", borderRadius: "4px", background: "#252525", color: "#fff", border: "1px solid #444" }}
                  >
                    {dateOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Dual-Input Custom Time Bounds */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ color: "#aaa", fontSize: "12px" }}>Time Interval Window</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <input 
                      type="time" 
                      value={filterTimeFrom} 
                      onChange={(e) => setFilterTimeFrom(e.target.value || "00:00")}
                      style={{ padding: "7px", borderRadius: "4px", background: "#252525", color: "#fff", border: "1px solid #444", width: "100%" }}
                    />
                    <span style={{ color: "#666" }}>to</span>
                    <input 
                      type="time" 
                      value={filterTimeTo} 
                      onChange={(e) => setFilterTimeTo(e.target.value || "23:59")}
                      style={{ padding: "7px", borderRadius: "4px", background: "#252525", color: "#fff", border: "1px solid #444", width: "100%" }}
                    />
                  </div>
                </div>

                {/* 3. Session Checkout Filters */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ color: "#aaa", fontSize: "12px" }}>Terminal Status</label>
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: "8px", borderRadius: "4px", background: "#252525", color: "#fff", border: "1px solid #444" }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="checked_out">Checked Out</option>
                    <option value="force_checked_out">Force Checked Out</option>
                  </select>
                </div>
              </div>
            )}

            {/* TABULAR RESULT RENDERING CONTAINER */}
            {filteredAttendance.length === 0 ? (
              <p className="empty-msg" style={{ textAlign: "center", padding: "40px 0" }}>
                No attendance records match your timeline criteria.
              </p>
            ) : (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Student LRN</th>
                    <th>PC</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((r, i) => (
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