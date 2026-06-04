import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import "./studentdashboard.css";

export default function StudentDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reservation, setReservation] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPc, setSelectedPc] = useState(null); // ← moved to top

  const API_BASE = "alejandra-uncognisable-undescriptively.ngrok-free.dev";

  // ✅ qrValue uses selectedPc — now safe since selectedPc is declared above
  const qrValue = selectedPc
    ? `checkin-${user?.id || user?.student_id}-${selectedPc}`
    : "";

  // ✅ Check if student already has an active reservation on load
  useEffect(() => {
    const checkReservation = async () => {
      try {
        const id = user?.id;
        if (!id) return;
        const res = await axios.get(`${API_BASE}/student/reservation/${id}`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        if (res.data?.pc_name) {
          setReservation(res.data);
        }
      } catch {
        // no reservation yet
      }
    };
    if (user?.id) checkReservation();
  }, [user]);

  // ✅ Auto-pick first available PC
  useEffect(() => {
    const fetchAvailablePc = async () => {
      try {
        const res = await axios.get(`${API_BASE}/admin/pcs`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        const sortedPcs = [...res.data].sort((a, b) =>
  a.pc_name.localeCompare(b.pc_name)
);

const firstAvailable = sortedPcs.find(
  pc => pc.status === "available"
);

if (firstAvailable) {
  setSelectedPc(firstAvailable.pc_name);
}
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.id) fetchAvailablePc();
  }, [user]);

  // ✅ Socket events
  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ["polling"],
      extraHeaders: { "ngrok-skip-browser-warning": "true" }
    });

    socket.on("connect", () => {
      socket.emit("join_student", { student_id: user?.id });
    });

    socket.on("pc_unlocked", (data) => {
      setReservation({
        pc_name: data.pc_name || "PC01",
        checked_in_at: data.checked_in_at || new Date().toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit"
        })
      });
    });

    socket.on("pc_locked", () => {
      setReservation(null);
      // ✅ Re-fetch available PC after checkout
      const fetchAvailablePc = async () => {
        try {
          const res = await axios.get(`${API_BASE}/admin/pcs`, {
            headers: { "ngrok-skip-browser-warning": "true" }
          });
          const sortedPcs = [...res.data].sort((a, b) =>
  a.pc_name.localeCompare(b.pc_name)
);

const firstAvailable = sortedPcs.find(
  pc => pc.status === "available"
);

if (firstAvailable) {
  setSelectedPc(firstAvailable.pc_name);
}
        } catch (err) {
          console.error(err);
        }
      };
      fetchAvailablePc();
    });

    return () => socket.disconnect();
  }, []);

  const handleLogout = async () => {
    try {
      if (reservation) {
        await axios.post(`${API_BASE}/checkout`, {
          student_id: user?.id || user?.student_id,
        }, { headers: { "ngrok-skip-browser-warning": "true" } });
      }
    } catch (err) {
      console.error("Checkout on logout failed:", err);
    } finally {
      if (onLogout) onLogout();
      navigate("/");
    }
  };

  const handleRequestPermission = async () => {
    try {
      setRequestLoading(true);

      if (!selectedPc) {
        alert("No PCs available right now.");
        return;
      }

      const studentId = user?.id || user?.student_id;
      await axios.post(`${API_BASE}/request-permission`, {
        student_id: studentId,
        pc_name: selectedPc,  // ✅ auto-picked PC not hardcoded
      }, { headers: { "ngrok-skip-browser-warning": "true" } });
      alert(`Permission request sent for ${selectedPc}!`);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to send request");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      await axios.post(`${API_BASE}/checkout`, {
        student_id: user?.id || user?.student_id,
      }, { headers: { "ngrok-skip-browser-warning": "true" } });
      setReservation(null);
      alert("Checked out successfully!");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setShowSettings(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="dashboard-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="left-icon" onClick={() => setShowReport(true)}>⚠</div>

        {showReport && (
          <div className="report-modal-overlay" onClick={() => setShowReport(false)}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Report an Issue</h3>
              <textarea
                placeholder="Describe the issue..."
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
              />
              <div className="report-buttons">
                <button onClick={async () => {
                  if (!reportMessage.trim()) { alert("Please enter a message first."); return; }
                  try {
                    await axios.post(`${API_BASE}/report`, {
                      student_id: user?.id || null,
                      message: reportMessage,
                    }, { headers: { "ngrok-skip-browser-warning": "true" } });
                    alert("Report sent successfully");
                    setReportMessage("");
                    setShowReport(false);
                  } catch { alert("Failed to send report"); }
                }}>Submit</button>
                <button className="cancel-btn" onClick={() => setShowReport(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="logo">MAPTIVA</div>

        <div className="right-icon" onClick={(e) => {
          e.stopPropagation();
          setShowSettings(!showSettings);
        }}>☰</div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="settings-menu" onClick={(e) => e.stopPropagation()}>
          <p><strong>{user?.name || "User"}</strong></p>
          <p>ID: {user?.student_id || user?.id}</p>
          <hr />
          <button onClick={() => navigate("/about")}>About Us</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      )}

      {/* TWO STATES */}
      {!reservation ? (
        <div className="qr-section">
          <div className="qr-card">
            {qrValue ? (
              <>
                <QRCode value={qrValue} size={180} />
                <h3>SCAN QR CODE</h3>
                <p className="pc-assigned">Assigned: {selectedPc}</p>
              </>
            ) : (
              <p style={{ color: "#b2bec3", textAlign: "center" }}>
                No PCs available right now
              </p>
            )}
          </div>
          <p
            className={`request-permission ${requestLoading ? "disabled" : ""}`}
            onClick={!requestLoading ? handleRequestPermission : undefined}
          >
            {requestLoading ? "Sending..." : "REQUEST PERMISSION"}
          </p>
        </div>
      ) : (
        <div className="qr-section">
          <div className="checkin-card">
            <div className="check-circle">✓</div>
            <h2>CHECK-IN SUCCESSFUL</h2>
            <p className="pc-display">
              {reservation.pc_name?.replace("PC", "PC - ")}
            </p>
            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Checking out..." : "Check Out"}
            </button>
            <p className="checkin-time">
              Checked in at {reservation.checked_in_at}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}