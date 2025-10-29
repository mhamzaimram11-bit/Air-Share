import React, { useState } from "react";

export default function Feedback() {
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("idle"); // idle | sending | done

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setMode("sending");

    setTimeout(() => {
      console.log("Feedback sent:", { email, text });
      setMode("done");
      setText("");
      setEmail("");

      setTimeout(() => setMode("idle"), 2000);
    }, 1500);
  };

  return (
    <div className="main-wrapper">
      <div className="registration registration_feedback">
        <h2 className="title title_share">Share your experience</h2>

        <form className="main-form" onSubmit={handleSubmit}>
          <fieldset className="main-form__validation">
            <div className="main-form__validation-wrap">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="main-form__validation">
            <div className="main-form__validation-wrap">
              <label htmlFor="feedback">FEEDBACK</label>
              <textarea
                name="feedback"
                id="feedback"
                placeholder="Type here"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </fieldset>

          <div className="main-form__btns">
            <button className="btn" type="submit" disabled={!text.trim() || mode === "sending"}>
              {mode === "sending"
                ? "Sending..."
                : mode === "done"
                ? "Done"
                : "Send Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
