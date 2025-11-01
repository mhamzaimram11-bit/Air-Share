import React from "react";

export default function Menu({ menuOpen, setMenuOpen, active }) {
  const links = [
    { name: "Share It", path: "/share" },
    { name: "About", path: "/about" },
    { name: "Feedback", path: "/feedback" },
  ];

  return (
    <nav className={`menu ${menuOpen ? "show" : ""}`} id="navMenu">
      {links.map((link) => (
        <a
          key={link.path} // use path as key
          href={link.path} // use path instead of href
          className={`menu__item ${active === link.path ? "active" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          {link.name}
        </a>
      ))}
    </nav>
  );
}