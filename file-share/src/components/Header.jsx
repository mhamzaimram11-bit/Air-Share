import React, { useState, useEffect } from "react";
import Menu from "./menu.jsx";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(window.location.pathname);

  useEffect(() => {
    const path = window.location.pathname;
    setActive(path);
  }, []);

  return (
    <div className="header">
      <a href="/" className="header__logo">
        <img
          className="desktop"
          src="https://airforshare.com/assets/img/logo.svg"
          alt="logo"
        />
      </a>

      <div
        className={`nav-toggle ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
        
      </div>

      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} active={active} />
    </div>
  );
}
