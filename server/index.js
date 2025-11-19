const express = require("express");
const path = require("path");
const http = require("http");
const fs = require("fs").promises;
const fsExtra = require("fs-extra");
const { Server } = require("socket.io");
const multer = require("multer");
const { cleanupOldFiles, clearAllFiles } = require("./cleanup");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(__dirname, "uploads");

fsExtra.ensureDirSync(DATA_DIR);
fsExtra.ensureDirSync(UPLOAD_DIR);

const clients = new Map();

app.use(express.json());

const clientBuildPath = path.join(__dirname, "../build");

app.use(express.static(clientBuildPath));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get IP from header
    const rawIP = req.headers["x-user-ip"];
    if (!rawIP) return cb(new Error("Missing IP"));

    const safeIP = rawIP.replace(/\./g, "_");
    const dir = path.join(UPLOAD_DIR, safeIP);
    fsExtra.ensureDirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage }).single("file");

// API TO GET LATEST TEXT AND FILES
app.get("/latest/:ip", async (req, res) => {
  const ip = req.params.ip;
  if (!ip || typeof ip !== "string")
    return res.status(400).json({ message: "Invalid IP" });

  const safeIP = ip.replace(/\./g, "_");
  const textFilePath = path.join(DATA_DIR, `${safeIP}.txt`);
  const userUploadDir = path.join(UPLOAD_DIR, safeIP);

  let text = "";
  let files = [];

  try {
    text = await fs.readFile(textFilePath, "utf8");
  } catch {}

  try {
    const uploadedFiles = await fs.readdir(userUploadDir);
    files = uploadedFiles.map((f) => ({
      name: f,
      url: `/uploads/${safeIP}/${f}`,
    }));
  } catch {}

  res.json({ text, files });
});


//API TO UPLOAD FILES
app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error("❌ Upload error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    const rawIP = req.headers["x-user-ip"];
    if (!rawIP)
      return res.status(400).json({ success: false, message: "Missing IP" });

    const safeIP = rawIP.replace(/\./g, "_");
    const file = req.file;

    const fileInfo = {
      name: file.filename,
      size: file.size,
      url: `/uploads/${safeIP}/${file.filename}`,
      time: new Date().toISOString(),
    };

    console.log("✅ File uploaded:", fileInfo);

    clients.forEach((client, socketId) => {
      if (client.ip === rawIP) io.to(socketId).emit("newFile", fileInfo);
    });

    res.json({ success: true, file: fileInfo });
  });
});

app.use("/uploads", express.static(UPLOAD_DIR));

io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  socket.on("registerIP", async (ip) => {
    if (!ip || typeof ip !== "string") {
      socket.emit("errorMsg", "Invalid IP detected.");
      return;
    }

    clients.set(socket.id, { ip });
    console.log(`✅ Registered IP for ${socket.id}: ${ip}`);

    const safeIP = ip.replace(/\./g, "_");

    try {
      const text = await fs.readFile(
        path.join(DATA_DIR, `${safeIP}.txt`),
        "utf8"
      );
      socket.emit("newText", text);
    } catch {
      socket.emit("newText", "");
    }

    try {
      const files = await fs.readdir(path.join(UPLOAD_DIR, safeIP));
      const fileInfos = files.map((f) => ({
        name: f,
        url: `/uploads/${safeIP}/${f}`,
      }));
      socket.emit("fileList", fileInfos);
    } catch {
      socket.emit("fileList", []);
    }
  });

  socket.on("shareText", async (text) => {
    const sender = clients.get(socket.id);
    if (!sender?.ip) return;

    const safeIP = sender.ip.replace(/\./g, "_");
    const filePath = path.join(DATA_DIR, `${safeIP}.txt`);
    try {
      await fs.writeFile(filePath, text, "utf8");
    } catch (err) {
      console.error("❌ Error saving text:", err);
    }

    clients.forEach((client, id) => {
      if (client.ip === sender.ip) io.to(id).emit("newText", text);
    });
  });

  socket.on("shareFileMeta", (fileInfo) => {
    const sender = clients.get(socket.id);
    if (!sender?.ip) return;

    clients.forEach((client, id) => {
      if (client.ip === sender.ip) io.to(id).emit("newFile", fileInfo);
    });
  });

  socket.on("disconnect", () => {
    const info = clients.get(socket.id);
    if (info) console.log(`🔴 ${socket.id} (IP: ${info.ip}) disconnected`);
    clients.delete(socket.id);
  });
});

setInterval(() => cleanupOldFiles(UPLOAD_DIR), 30 * 60 * 1000);

//API TO CLEAR ALL FILES FOR A USER
app.post("/clear-all", async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.json({ success: false, message: "Missing IP" });

    const safeIP = ip.replace(/\./g, "_");
    const userDir = path.join(UPLOAD_DIR, safeIP);
    // const textFile = path.join(DATA_DIR, `${safeIP}.txt`);

    await clearAllFiles(userDir);
    // await fs.promises.writeFile(textFile, ""); BUGG

    res.json({ success: true, message: "Files cleared" });
  } catch (err) {
    console.error("Clear-all error:", err);
    res.status(500).json({ success: false, message: "Failed to clear files" });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log(`📂 Upload directory: ${UPLOAD_DIR}`);
});
