import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./studentsignup.css";

export default function StudentSignup() {
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState(""); // Holds the 12-digit numeric LRN
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // ✅ Added state for email address
  const [error, setError] = useState("");

  const API_BASE = "https://somehow-fighter-transportation-tomorrow.trycloudflare.com";

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Enforce local validation checking for exactly 12 numeric digits
    const lrnPattern = /^\d{12}$/;
    if (!lrnPattern.test(studentId)) {
      setError("LRN must be exactly 12 digits (e.g., 102345678901).");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/signup`, {
        name,
        student_id: studentId, // Passes clean numeric string directly to database handler
        password,
        email, // ✅ Added email to the registration payload data
      });

      if (res.status === 201) {
        alert("Account created successfully!");
        navigate("/"); // Go back to login page
      }
    } catch (err) {
      // ✅ Dynamic error handling based on backend messages
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Signup failed. Please try again.");
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="form-box">
        {/* ✅ Directly reference the public folder using an absolute root path */}
        <div className="logo-container">
          <img src="/logo.png" alt="MAPTIVA Logo" className="form-logo" />
        </div>

        <h2>Create Account</h2>

        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* ✅ Updated: Changed placeholder to LRN, locked max length, and filters out letters */}
          <input
            type="text"
            placeholder="12-Digit LRN"
            maxLength={12}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
            required
          />

          {/* ✅ Added Email Address Input field */}
          <input
            type="email"
            placeholder="School Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Sign Up
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <p className="signup-text">
          Already have an account?{" "}
          <span
            className="link"
            onClick={() => navigate("/")}
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}