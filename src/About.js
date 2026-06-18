import React from "react";
import { useNavigate } from "react-router-dom";
import "./AboutUs.css";

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="about-container">
      {/* HEADER SECTION WITH CURVED WAVE */}
      <div className="about-header">
        <button className="back-arrow-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <div className="logo-wrapper">
          <div className="brand-m-logo">M</div>
          <div className="brand-text-group">
            <h1 className="brand-main-title">MAPTIVA</h1>
            <p className="brand-subtitle">we make it easy.</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT INNER BODY */}
      <div className="about-body">
        <h2 className="content-heading">Computer Lab Seat Tracker</h2>
        
        <p className="content-paragraph">
          <span className="highlight-brand">Maptiva</span> is a student developed seat tracking system designed to make computer lab management accurate and effortless.
        </p>

        <p className="content-paragraph">
          We created <span className="highlight-brand">Maptiva</span> to solve a common problem: manual paper logs that cause errors or misplaced blame when something goes wrong. With Maptiva, each student's seat is tracked in real time through QR code scanning, ensuring transparency and accountability for everyone.
        </p>
      </div>

      {/* FOOTER VALUES STRIP */}
      <div className="about-footer-strip">
        <div className="values-column">
          <div className="value-block">
            <h3 className="value-title">MISSION</h3>
            <p className="value-text">
              To make seat tracking smarter, fairer, and more reliable for students and schools.
            </p>
          </div>
          
          <div className="value-block">
            <h3 className="value-title">VISION</h3>
            <p className="value-text">
              A connected and transparent school community powered by technology.
            </p>
          </div>
        </div>

        <div className="overview-branding">
          <span className="overview-tag">Overview</span>
          <h2 className="overview-title">About Us</h2>
        </div>
      </div>
    </div>
  );
}