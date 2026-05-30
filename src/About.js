import React from "react";
import { useNavigate } from "react-router-dom";
import ".../about.css";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-container">

      {/* 🔙 Back Button */}
      <div className="back-button" onClick={() => navigate(-1)}>
        ←
      </div>

      {/* 📜 Scrollable Content */}
      <div className="about-content">
        <h1 className="logo">MA</h1>
        <h2 className="title">MAPTIVA</h2>
        <p className="tagline">we make it easy.</p>

        <h3 className="section-title">Computer Lab Seat Tracker</h3>
        <p className="paragraph">
          Maptiva is a student-developed seat tracking system designed to make
          computer lab management accurate and effortless.
        </p>
        <p className="paragraph">
          We created Maptiva to solve a common problem — manual paper logs that
          cause errors or misplaced blame when something goes wrong. With
          Maptiva, each student’s seat is tracked in real time through QR code
          scanning, ensuring transparency and accountability for everyone.
        </p>

        <div className="subheading">MISSION</div>
        <p className="paragraph">
          To make seat tracking smarter, fairer, and more reliable for students
          and schools.
        </p>

        <div className="subheading">VISION</div>
        <p className="paragraph">
          A connected and transparent school community powered by technology.
        </p>

        <p className="footer-title">Overview</p>
        <p className="footer">About Us</p>
      </div>
    </div>
  );
}