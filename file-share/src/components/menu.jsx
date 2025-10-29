import React from "react";

export default function Menu({ menuOpen, setMenuOpen, active }) {
  const links = [
    { name: "Share It", href: "/" },
    { name: "About", href: "/about" },
    // { name: "Upgrade", href: "/upgrade" },
    { name: "Feedback", href: "/feedback" },
    // { name: "Login / Register", href: "/login" },
  ];

  return (
    <nav className={`menu ${menuOpen ? "show" : ""}`} id="navMenu">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={`menu__item ${active === link.href ? "active" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          {link.name}
        </a>
      ))}
    </nav>
  );
};
