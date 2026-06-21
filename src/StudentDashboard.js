import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import "./studentdashboard.css";

export default function StudentDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [showSettings, setShowSettings] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reservation, setReservation] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPc, setSelectedPc] = useState(null);

  // === Secure Dynamic Token States ===
  const [qrToken, setQrToken] = useState("");
  const [loadingToken, setLoadingToken] = useState(true);

  const API_BASE = "https://membrane-mate-fourth-disks.trycloudflare.com";

  // 1️⃣ Check active reservation status on load
  useEffect(() => {
    const checkActiveReservation = async () => {
      const id = user?.id; 
      if (!id) return;
      
      try {
        const res = await axios.get(`${API_BASE}/student/reservation/${id}`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        if (res.data?.pc_name) {
          setReservation(res.data);
        }
      } catch (err) {
        console.log("No active workstation reservation session found.");
      }
    };
    checkActiveReservation();
  }, [user, API_BASE]);

  // 2️⃣ Auto-pick first available workstation PC
  useEffect(() => {
    const fetchAvailablePc = async () => {
      try {
        const res = await axios.get(`${API_BASE}/admin/pcs`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        const firstAvailable = res.data.find(pc => pc.status === "available");
        if (firstAvailable) setSelectedPc(firstAvailable.pc_name);
      } catch (err) {
        console.error("Failed to discover workstations:", err);
      }
    };
    if (user?.id) fetchAvailablePc();
  }, [user, API_BASE]);

  // 3️⃣ 🛡️ Fetch Secure Anti-Theft QR Token Linked to Identity
  useEffect(() => {
    let tokenInterval;
    if (reservation) return; // Stop fetching tokens if already checked in

    const fetchSecureToken = async () => {
      const currentStudentId = user?.id;
      if (!currentStudentId || !selectedPc) return;

      try {
        setLoadingToken(true);
        // Request token via POST with current user ID to trigger backend security lock
        const res = await axios.post(`${API_BASE}/qr-token`, {
          student_id: currentStudentId
        }, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });

        if (res.data?.token) {
          // Format structural QR intent so your mobile scanner maps it correctly
          setQrToken(`checkin:${res.data.token}:${selectedPc}`);
        }
        setLoadingToken(false);
      } catch (err) {
        console.error("Failed to generate identity-secured token:", err);
        setLoadingToken(false);
      }
    };

    fetchSecureToken();
    tokenInterval = setInterval(fetchSecureToken, 120000); // Regenerate every 2 minutes

    return () => clearInterval(tokenInterval);
  }, [user, selectedPc, reservation, API_BASE]);

  // 4️⃣ Live Web-Socket Session Listeners
  useEffect(() => {
    if (!user?.id) return;

    socketRef.current = io(API_BASE, {
      transports: ["websocket", "polling"],
      forceNew: true,
      extraHeaders: { "ngrok-skip-browser-warning": "true" }
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join_student", { student_id: user.id });
    });

    socketRef.current.on("pc_unlocked", (data) => {
      setReservation({
        pc_name: data.pc_name || "PC01",
        checked_in_at: data.checked_in_at || new Date().toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit"
        })
      });
    });

    socketRef.current.on("pc_locked", () => {
      setReservation(null);
      // Re-fetch next available workstation right after checkout triggers
      const fetchAvailablePc = async () => {
        try {
          const res = await axios.get(`${API_BASE}/admin/pcs`, {
            headers: { "ngrok-skip-browser-warning": "true" }
          });
          const firstAvailable = res.data.find(pc => pc.status === "available");
          if (firstAvailable) setSelectedPc(firstAvailable.pc_name);
        } catch (err) {
          console.error(err);
        }
      };
      fetchAvailablePc();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("pc_unlocked");
        socketRef.current.off("pc_locked");
        socketRef.current.disconnect();
      }
    };
  }, [user?.id, API_BASE]);

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
        pc_name: selectedPc,
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
        <div className="left-icon" onClick={() => setShowReport(true)}></div>

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

      {/* Two Layout States */}
      {!reservation ? (
        <div className="qr-section">
          <div className="qr-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "260px" }}>
            {loadingToken ? (
              <div className="spinner">
                <div className="bounce1"></div>
                <div className="bounce2"></div>
                <div className="bounce3"></div>
              </div>
            ) : qrToken ? (
              <>
                <QRCode value={qrToken} size={180} />
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