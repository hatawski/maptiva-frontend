import React, { useState } from "react";
import axios from "axios";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // ✅ Uses your verified dynamic Cloudflare URL endpoint routing tunnel
  const API_BASE = "https://atom-scratch-agreements-toxic.trycloudflare.com";

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      alert(res.data.message);
      if (res.status === 200) setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reach server.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP and rewrite account password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password`, {
        email,
        otp,
        new_password: newPassword,
      });
      alert(res.data.message);
      if (res.status === 200) {
        setStep(1);
        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        onClose(); // Exit on pass
      }
    } catch (err) {
      alert(err.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>Account Recovery</h3>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} style={styles.form}>
            <p style={styles.infoText}>Enter your registered email address to receive a 6-digit recovery code.</p>
            <input
              type="email"
              placeholder="School Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <button type="submit" disabled={loading} style={styles.actionBtn}>
              {loading ? "Sending..." : "Request Recovery Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={styles.form}>
            <p style={styles.infoText}>Enter the code sent to <strong>{email}</strong> along with your new password.</p>
            <input
              type="text"
              placeholder="6-Digit OTP Code"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              required
            />
            <div style={styles.buttonGroup}>
              <button type="button" onClick={() => setStep(1)} style={styles.backBtn}>Back</button>
              <button type="submit" disabled={loading} style={styles.actionBtn}>
                {loading ? "Resetting..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { background: "#062743", padding: "24px", borderRadius: "12px", width: "90%", maxWidth: "400px", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontFamily: "Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", color: "#00d4a0" },
  closeBtn: { background: "none", border: "none", color: "#b2bec3", fontSize: "24px", cursor: "pointer" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  infoText: { fontSize: "14px", color: "#b2bec3", margin: "0 0 8px 0", lineHeight: "1.4" },
  input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: "15px", outline: "none" },
  actionBtn: { background: "#00b894", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", flex: 1 },
  backBtn: { background: "transparent", color: "#b2bec3", border: "1px solid #b2bec3", padding: "12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "80px" },
  buttonGroup: { display: "flex", gap: "10px", marginTop: "4px" }
};

export default ForgotPasswordModal;