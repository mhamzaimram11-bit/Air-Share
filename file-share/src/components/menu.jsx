import React from "react";
import { Link } from "react-router-dom";

export default function Menu({ menuOpen, setMenuOpen, active }) {
  const links = [
    { name: "Share Text", path: "/share" },
    { name: "Share Files", path: "/upload" },
    { name: "About", path: "/about" },
    { name: "Feedback", path: "/feedback" },
  ];

  return (
    <nav className={`menu ${menuOpen ? "show" : ""}`} id="navMenu">
      {links.map((link) => (
        <a
          key={link.path} 
          href={link.path} 
          className={`menu__item ${active === link.path ? "active" : ""}`}
          onClick={() => setMenuOpen(false)}
          tabIndex={0}
        >
          {link.name}
        </a>
      ))}
    </nav>
  );
}