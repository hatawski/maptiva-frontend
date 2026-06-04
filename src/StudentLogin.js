import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./studentlogin.css";

export default function StudentLogin({ onLogin }) {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [qrValue, setQrValue] = useState(null);
  const [loadingQR, setLoadingQR] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportName, setReportName] = useState("");

  const API_BASE = " https://alejandra-uncognisable-undescriptively.ngrok-free.dev";

  // ===============================
  // 1️⃣ Manual Login
  // ===============================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const formattedId = studentId.startsWith("CA")
      ? studentId
      : `CA${studentId}`;

    try {
      const res = await axios.post(`${API_BASE}/login`, {
        student_id: formattedId,
        password,
      }, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      if (res.status === 200) {
        onLogin(res.data);
        navigate("/Dashboard");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid Student ID or Password.");
      } else if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to the server.");
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  // ===============================
  // 2️⃣ Report Submit
  // ===============================
  const handleReportSubmit = async () => {
    if (!reportMessage.trim()) {
      alert("Please enter a message first.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/report`, {
        student_id: null,
        message: reportName
          ? `[${reportName}]: ${reportMessage}`
          : reportMessage,
      }, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      alert("Report sent successfully!");
      setReportMessage("");
      setReportName("");
      setShowReport(false);
    } catch {
      alert("Failed to send report. Please try again.");
    }
  };

  // ===============================
  // 3️⃣ QR Login Setup
  // ===============================
  useEffect(() => {
    let interval;

    const generateQR = async () => {
      try {
        setLoadingQR(true);

        const res = await axios.get(`${API_BASE}/qr-token`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });

        if (!res.data || !res.data.token) {
          throw new Error("Invalid token response");
        }

        const token = String(res.data.token);
        setQrValue(token);
        setLoadingQR(false);

        if (socketRef.current) socketRef.current.disconnect();
        socketRef.current = io(API_BASE, {
          transports: ["polling"],
          extraHeaders: { "ngrok-skip-browser-warning": "true" }
        });

        socketRef.current.emit("join", { token });

        socketRef.current.on("qr_authorized", (user) => {
          onLogin(user);
          navigate("/Dashboard");
        });
      } catch (err) {
        console.error("QR setup failed:", err);
        setQrValue(null);
        setLoadingQR(false);
      }
    };

    generateQR();
    interval = setInterval(generateQR, 120000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(interval);
    };
  }, [API_BASE, navigate, onLogin]);

  return (
    <div className="login-page">

      {/* ✅ REPORT BUTTON TOP LEFT */}
      <div className="report-btn" onClick={() => setShowReport(true)}>
        ⚠
      </div>

      {/* ✅ REPORT MODAL */}
      {showReport && (
        <div className="report-modal-overlay" onClick={() => setShowReport(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Report an Issue</h3>
            <p className="report-subtitle">You don't need to be logged in to report.</p>

            <input
              type="text"
              placeholder="Your name (optional)"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />

            <textarea
              placeholder="Describe the issue..."
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
            />

            <div className="report-buttons">
              <button onClick={handleReportSubmit}>Submit</button>
              <button
                className="cancel-btn"
                onClick={() => setShowReport(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGO */}
      <img src="/logo.png" alt="Logo" className="logo" />

      {/* STUDENT BADGE */}
      <div className="student-badge">Student</div>

      {/* MAIN ROW */}
      <div className="login-container">

        {/* LEFT — FORM */}
        <div className="login-form">
          <h2>Log In</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Account No."
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="primary-btn">
              Log In
            </button>
          </form>

          {error && <p className="error">{error}</p>}

          <p className="signup-link">
            Don't have an account?{" "}
            <span className="link" onClick={() => navigate("/signup")}>
              Sign up
            </span>
          </p>
        </div>

        {/* RIGHT — QR */}
        <div className="qr-container">
          {loadingQR && (
            <div className="spinner">
              <div className="bounce1"></div>
              <div className="bounce2"></div>
              <div className="bounce3"></div>
            </div>
          )}
          {!loadingQR && qrValue && typeof qrValue === "string" && (
            <>
              <QRCode value={qrValue} size={180} />
              <p className="qr-hint">Scan with mobile app to login</p>
            </>
          )}
          {!loadingQR && !qrValue && (
            <p>QR unavailable. Please refresh.</p>
          )}
        </div>

      </div>
    </div>
  );
}