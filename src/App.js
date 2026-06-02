import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import StudentLogin from "./StudentLogin";
import StudentSignup from "./StudentSignup";
import StudentDashboard from "./StudentDashboard";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";
import About from "./About";

export default function App() {
  // ✅ Load user from localStorage on startup
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("isAdmin") === "true";
  });

  // ✅ Save user to localStorage when it changes
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
    localStorage.setItem("isAdmin", "true");
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("isAdmin");
  };

  // ✅ Keep Render backend awake
useEffect(() => {
  const keepAlive = () => {
    fetch("https://maptiva-backend.onrender.com/debug/pcs")
      .catch(() => {});
  };
  
  keepAlive(); // ping on load
  const interval = setInterval(keepAlive, 14 * 60 * 1000); // every 14 mins
  return () => clearInterval(interval);
}, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<StudentLogin onLogin={handleLogin} />} />
        <Route path="/signup" element={<StudentSignup />} />
        <Route
          path="/Dashboard"
          element={
            user ? (
              <StudentDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/Admin"
          element={<AdminLogin onAdminLogin={handleAdminLogin} />}
        />
        <Route
          path="/adminpanel"
          element={
            isAdmin ? (
              <AdminPanel onLogout={handleAdminLogout} />
            ) : (
              <Navigate to="/Admin" />
            )
          }
        />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}