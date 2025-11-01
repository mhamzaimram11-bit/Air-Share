import React, { useState, useRef } from "react";

export default function About() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleDragOver = (e) => e.preventDefault();

  const processFiles = (incomingFiles) => {
    const validFiles = [];
    let errorMsg = "";

    for (const file of incomingFiles) {
      if (!allowedTypes.includes(file.type)) {
        errorMsg = `Unsupported file type: ${file.name}`;
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        errorMsg = `File too large: ${file.name} (max 5MB)`;
        continue;
      }
      validFiles.push(file);
    }

    setError(errorMsg);
    setFiles((prev) => [...prev, ...validFiles].slice(0, 2)); // limit to 2 files
  };

  const handleBrowseClick = () => fileInputRef.current.click();

  const handleReset = () => {
    setFiles([]);
    setError("");
  };

  return (
    <div
      className={`upload-cont-box__drop-paste ${
        files.length === 0
          ? "upload-cont-box__drop-paste_not-filled"
          : "upload-cont-box__drop-paste__drop_foc"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Hidden file input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".jpg,.jpeg,.png,.pdf"
        style={{ display: "none" }}
      />

      <div className="upload-cont-box__text">
        {files.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "20px",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            {files.map((file, i) => {
              const isImage = file.type.startsWith("image/");
              const fileURL = URL.createObjectURL(file);

              return (
                <div
                  key={i}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    overflow: "hidden",
                    textAlign: "center",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      height: "12rem",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      background: "#f9f9f9",
                    }}
                  >
                    {isImage ? (
                      <img
                        src={fileURL}
                        alt={file.name}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "100px" }}>📄</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* “Add File” Card */}
            <div
              onClick={handleBrowseClick}
              style={{
                border: "1px dashed #aaa",
                borderRadius: "6px",
                height: "12rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                background: "#fafafa",
              }}
            >
              <span style={{ fontSize: "30px", color: "#6c63ff" }}>+</span>
              <span style={{  color: "#6c63ff" }}>
                Add File
              </span>
              <span style={{ color: "#999" }}>
                (up to 5Mb)
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Empty state (no files yet) */}
            <div className="hidden_on_mobile">
              <span>
                Drag and drop any files{" "}
                <span className="ng-binding ng-scope">
                  (up to 2 files, 5MB each)
                </span>{" "}
                or{" "}
                <span
                  className="upload-cont-box__upload"
                  onClick={handleBrowseClick}
                  tabIndex="0"
                  role="button"
                >
                  Browse
                </span>
              </span>
            </div>
          </>
        )}

        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>
            {error}
          </p>
        )}

        {files.length > 0 && (
          <button
            className="btn-clear"
            onClick={handleReset}
            style={{
              cursor: "pointer",
              display: "flex",
              position: "absolute",
              right: "20px",
              bottom: "120px",
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
