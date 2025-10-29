import React from "react";
import Header from "../components/Header";
import TextShareForm from "../components/TextShareForm";
import "../App.css";


export default function FromShare() {
  return (
    <div className="site-wrapper">
      <Header />
            <div className="container">
        <TextShareForm />
</div>
      </div>
  );
};
