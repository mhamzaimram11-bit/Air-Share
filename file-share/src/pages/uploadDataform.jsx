import React from "react";
import Header from "../components/Header";
import UploadData from "../components/uploadform";
import "../App.css";


export default function UploadDataFrom () {
  return (
    <div className="site-wrapper">
      <Header />
            <div className="container">
      <UploadData />
</div>
      </div>
  );
};
