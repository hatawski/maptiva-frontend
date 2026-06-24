import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import QRCode from "react-qr-code";
import axios from "axios";
import "./lockscreen.css";

const PC_NAME = "PC01"; // ← change this per machine

const API_BASE = "https://nav-reflected-pic-blank.trycloudflare.com";

export default function LockScreen({ onUnlock }) {
  const [status, setStatus] = useState("locked");
  const [requestSent, setRequestSent] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyPass, setEmergencyPass] = useState("");
  const [qrToken, setQrToken] = useState("");

  // ✅ Generate QR token on load
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await axios.get(`${API_BASE}/qr-token`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        setQrToken(res.data.token);
      } catch (err) {
        console.error("Failed to fetch QR token", err);
      }
    };
    fetchToken();
  }, []);

  // ✅ Connect socket and join PC room
  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      forceNew: true,
      extraHeaders: { "ngrok-skip-browser-warning": "true" }
    });

    socket.on("connect", () => {
      socket.emit("join_pc", { pc_name: PC_NAME });
      console.log(`Connected as ${PC_NAME}`);
    });

    // Unlock event from admin or QR scan
    socket.on("pc_unlocked", () => {
      setStatus("unlocked");
      onUnlock(); // tell App.js to show login
    });

    return () => socket.disconnect();
  }, []);

  // ✅ Permission request
  const handleRequestPermission = async () => {
    try {
      setRequestSent(true);
      await axios.post(`${API_BASE}/request-permission`, {
        student_id: null,
        pc_name: PC_NAME,
      }, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      alert("Permission request sent to admin!");
    } catch (err) {
      alert("Failed to send request");
      setRequestSent(false);
    }
  };

  // ✅ Emergency unlock — click logo 5 times
  const handleLogoClick = () => {
    setLogoClicks(prev => {
      if (prev + 1 >= 5) {
        setShowEmergency(true);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleEmergencyUnlock = () => {
    if (emergencyPass === "maptiva") { // ← change this password
      onUnlock();
    } else {
      alert("Wrong password");
      setEmergencyPass("");
    }
  };

  return (
    <div className="lockscreen">
      {/* Logo — click 5x for emergency unlock */}
      <h1 className="lock-logo" onClick={handleLogoClick}>
        MAPTIVA
      </h1>

      <p className="lock-pc-name">{PC_NAME}</p>
      <p className="lock-subtitle">Scan QR code with your phone to unlock</p>

      {/* QR Code */}
      <div className="lock-qr">
        {qrToken ? (
          <QRCode value={qrToken} size={200} />
        ) : (
          <p>Loading QR...</p>
        )}
      </div>

      <p className="lock-or">— OR —</p>

      {/* Permission Request Button */}
      <button
        className="lock-request-btn"
        onClick={handleRequestPermission}
        disabled={requestSent}
      >
        {requestSent ? "Request Sent — Waiting for Admin..." : "REQUEST PERMISSION"}
      </button>

      {/* Emergency Unlock */}
      {showEmergency && (
        <div className="emergency-overlay">
          <div className="emergency-box">
            <h3>Emergency Unlock</h3>
            <input
              type="password"
              placeholder="Enter password"
              value={emergencyPass}
              onChange={(e) => setEmergencyPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmergencyUnlock()}
            />
            <button onClick={handleEmergencyUnlock}>Unlock</button>
            <button onClick={() => setShowEmergency(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}