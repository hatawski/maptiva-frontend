import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./studentsignup.css";

export default function StudentSignup() {
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const API_BASE =
    " https://alejandra-uncognisable-undescriptively.ngrok-free.dev";

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${API_BASE}/signup`, {
        name,
        student_id: studentId,
        password,
      });

      if (res.status === 201) {
        alert("Account created successfully!");
        navigate("/"); // Go back to login page
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError("Student ID already exists.");
      } else {
        setError("Signup failed. Please try again.");
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="form-box">
        <h2>Create Account</h2>

        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
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