import React from "react";
import Header from "../components/Header";
import "../App.css";
import About from "../components/TextFormDetail";

export default function  StaticFrom() {
  return (
    <div className="site-wrapper">
      <Header />
      <div className="container">
        <About />
      </div>
    </div>
  );
}
