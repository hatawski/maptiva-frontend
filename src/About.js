import React from "react";
import { useNavigate } from "react-router-dom";
import "./about.css";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-container">
      
      {/* 🟢 TOP HEADER SECTION */}
      <header className="header-card">
        {/* 🔙 Back Button remains anchored nicely to the left edge area */}
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        
        {/* Added wrapper for margin alignment */}
        <div className="header-inner">
          <div className="logo-wrapper">
            <img src="/logo.png" alt="Maptiva Logo" className="logo-img" />
            <div className="logo-text">
              <h1 className="title">MAPTIVA</h1>
              <p className="tagline">we make it easy.</p>
            </div>
          </div>
        </div>
      </header>

      {/* ⚪ MIDDLE CONTENT SECTION */}
      <main className="about-content">
        <h3 className="section-title">Computer Lab Seat Tracker</h3>
        <p className="paragraph">
          <span className="brand-highlight">Maptiva</span> is a student-developed seat tracking system designed to make
          computer lab management accurate and effortless.
        </p>
        <p className="paragraph">
          We created <span className="brand-highlight">Maptiva</span> to solve a common problem — manual paper logs that
          cause errors or misplaced blame when something goes wrong. With
          Maptiva, each student’s seat is tracked in real time through QR code
          scanning, ensuring transparency and accountability for everyone.
        </p>
      </main>

      {/* 🔵 BOTTOM FOOTER BANNER */}
      <footer className="info-footer">
        {/* Added wrapper for margin alignment */}
        <div className="footer-inner">
          <div className="footer-left">
            <div className="info-block">
              <h4 className="subheading">MISSION</h4>
              <p className="footer-paragraph">
                To make seat tracking smarter, fairer, and more reliable for students and schools.
              </p>
            </div>
            <div className="info-block">
              <h4 className="subheading">VISION</h4>
              <p className="footer-paragraph">
                A connected and transparent school community powered by technology.
              </p>
            </div>
          </div>
          
          <div className="footer-right">
            <p className="footer-title">Overview</p>
            <p className="footer-heading">About Us</p>
          </div>
        </div>
      </footer>

    </div>
  );
}