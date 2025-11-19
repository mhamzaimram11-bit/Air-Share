import React, { useState, useRef, useEffect } from "react";
import socket from "../socket";

export default function About() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [userIP, setUserIP] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [mode, setMode] = useState("download");

  const fileInputRef = useRef(null);
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

  //APi CALL TO GET IP ADDRESS
  useEffect(() => {
    const registerIP = async () => {
      try {
        const res = await fetch("https://api64.ipify.org?format=json");
        const data = await res.json();

        if (data.ip) {
          setUserIP(data.ip);
          socket.emit("registerIP", data.ip);
          loadLatestFiles(data.ip);
        }
      } catch (err) {
        console.error("IP fetch failed:", err);
      }
    };

    registerIP();

    socket.on("newFile", (fileInfo) => {
      setFiles((prev) => {
        return prev.map((f) =>
          f.name === fileInfo.name
            ? { ...f, url: fileInfo.url } 
            : f
        );
      });

      setMode("download");
      setHasSaved(true);
    });

    return () => {
      socket.off("newFile");
    };
  }, []);

  //API CALL TO UPLOAD FILES
  const uploadFiles = async (fileList) => {
    if (!userIP) return { message: "INVALID IP FOUND" };

    for (const file of fileList) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/upload", {
          method: "POST",
          body: formData,
          headers: {
            "x-user-ip": userIP,
          },
        });

        const result = await res.json();
        if (!result.success) {
          setError("Upload failed: " + (result.message ?? ""));
        }
      } catch (err) {
        console.error("Upload failed:", err);
        setError("Upload failed. Check server logs.");
      }
    }
  };

  //API CALL TO LOAD FILES
  const loadLatestFiles = async (ip) => {
    try {
      const res = await fetch(`/latest/${ip}`);
      const data = await res.json();
      const savedFiles = (data.files || []).map((f) => ({
        name: f.name,
        url: f.url,
      }));
      setFiles(savedFiles);
      setHasSaved(savedFiles.length > 0);
      setMode(savedFiles.length ? "download" : "");
    } catch (err) {
      console.error("Load files failed:", err);
    }
  };

  //API CALL TO DELETE FILES
  const deleteFile = async () => {
    if (!userIP) return { message: "INVALID IP" };

    try {
      const res = await fetch("/clear-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ip: userIP }),
      });

      const data = await res.json();
      if (data.success) {
        setFiles([]);
        setError("");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setError("Failed to clear files.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    e.target.value = "";
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
      if (validFiles.length + files.length >= 2) {
        errorMsg = `Maximum 2 files allowed`;
        break;
      }

      validFiles.push({
        file,
        name: file.name,
        url: URL.createObjectURL(file),
      });
    }

    setError(errorMsg);
    setFiles((prev) => [...prev, ...validFiles].slice(0, 2));

    if (validFiles.length > 0) {
      setTimeout(() => uploadFiles(validFiles.map((f) => f.file)), 80);
    }
  };

  const handleBrowseClick = () => fileInputRef.current.click();

  const isAddFileDisabled = files.length >= 2;

  useEffect(() => {
    return () => {
      files.forEach((file) => file.file && URL.revokeObjectURL(file.file));
    };
  }, [files]);

  return (
    <div className="app-tab-content">
      <div className="app-tab-content__title">Upload File</div>

      <div
        className={`upload-cont-box__drop-paste ${
          files.length === 0
            ? "upload-cont-box__drop-paste_not-filled"
            : "upload-cont-box__drop-paste__drop_foc"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
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
                const isImage =
                  (file.file && file.file.type.startsWith("image/")) ||
                  file.url?.endsWith(".jpg") ||
                  file.url?.endsWith(".png");

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
                          src={file.url}
                          alt={file.name}
                          style={{
                            maxHeight: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "100px" }}>📄</span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#333",
                        background: "#fafafa",
                      }}
                    ></div>
                  </div>
                );
              })}

              <div
                onClick={!isAddFileDisabled ? handleBrowseClick : undefined}
                style={{
                  border: "1px dashed #aaa",
                  borderRadius: "6px",
                  height: "12rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: isAddFileDisabled ? "not-allowed" : "pointer",
                  opacity: isAddFileDisabled ? 0.4 : 1,
                  background: "#fafafa",
                }}
              >
                <span style={{ fontSize: "30px", color: "#6c63ff" }}>+</span>
                <span style={{ color: "#6c63ff" }}>Add File</span>
                <span style={{ color: "#999" }}>(up to 5MB)</span>
              </div>
            </div>
          ) : (
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
          )}

          {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

          {files.length > 0 && (
            <button
              className="btn-clear"
              onClick={() => {
                deleteFile();
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );

}
