import React, { useState, useEffect } from "react";
import socket from "../socket";



export default function TextShareForm() {
  const [text, setText] = useState("");
  const [userIP, setUserIP] = useState(null);
  const [mode, setMode] = useState("save");
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const registerIP = async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        if (data.ip) {
          setUserIP(data.ip);
          socket.emit("registerIP", data.ip);
          loadLatestText(data.ip);
        }
      } catch (err) {
        console.error("IP fetch failed:", err);
      }
    };
    registerIP();

    socket.on("newText", (newText) => {
      setText(newText);
      setMode(newText.trim() ? "copy" : "save");
      setHasSaved(!!newText.trim());
    });
  }, []);

  const loadLatestText = async (ip) => {
    try {
      const res = await fetch(`/latest/${ip}`);
      const data = await res.json();
      const savedText = data?.text || "";
      setText(savedText);
      setHasSaved(savedText.trim() !== "");
      setMode(savedText.trim() ? "copy" : "save");
    } catch (err) {
      console.error("Load text failed:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (mode === "copy") {
      await navigator.clipboard.writeText(text);
      setMode("copied");
      setTimeout(() => setMode("copy"), 2000);
    } else {
      if (!userIP) return alert("IP not registered yet!");
      socket.emit("shareText", text);
      setMode("saving...");
      setTimeout(() => {
        setMode("copy");
        setHasSaved(true);
      }, 500);
    }
  };

  const clearText = () => {
    setText("");
    setMode("save");
    setHasSaved(false);
    if (userIP) socket.emit("shareText", "");
  };

  return (
    <form id="shareForm" className="app-tab-content" onSubmit={handleSubmit}>
      <div className="app-tab-content__title">Text</div>
      <div className="app-text-wrap">
        <textarea
          placeholder="Type something..."
          className="autoresize-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>
      </div>

      <div className="app-text-submit">
        {text.trim() && (
          <button className="btn-clear" type="button" onClick={clearText}>
            Clear
          </button>
        )}
        <button className="btn" type="submit" disabled={!text.trim()}>
          {mode === "copied" ? "Copied!" : mode === "saving..." ? "Saving..." : mode === "copy" ? "Copy" : "Save"}
        </button>
      </div>
    </form>
  );
}
