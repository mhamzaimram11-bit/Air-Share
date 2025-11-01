import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import FromShare from "./pages/share";
import StaticFrom from "./pages/form";
import FeedbackPage from "./pages/feedback";
import UploadDataFrom from "./pages/uploadDataform";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/share" replace />} />
        <Route path="/share" element={<FromShare />} />
        <Route path="/about" element={<StaticFrom />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/upload" element={<UploadDataFrom/>} />
         <Route path="*" element={<Navigate to="/share" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
