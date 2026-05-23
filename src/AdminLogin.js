import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./adminlogin.css";

export default function AdminLogin({ onAdminLogin }) {  // ← add prop
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = "https://alejandra-uncognisable-undescriptively.ngrok-free.dev";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/admin/login`, {
        username,
        password,
      }, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      onAdminLogin();        // ← call this to set isAdmin true in App.js
      navigate("/adminpanel");
    } catch (err) {
      setError("Invalid admin username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <h1>MAPTIVA</h1>
        <h2>Admin Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {error && <p className="admin-error">{error}</p>}
      </div>
    </div>
  );
}