import React from "react";
import Header from "./components/Header";
import TextShareForm from "./components/TextShareForm";
import "./App.css";
import About from "./components/TextFormDetail";

export default function App() {
  return (
    <div className="site-wrapper">
      <Header />
      <div className="container">
        {/* <TextShareForm /> */}
        <About />
      </div>
    </div>
  );
};
