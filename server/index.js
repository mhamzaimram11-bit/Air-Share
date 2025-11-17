// require("dotenv").config();
// const express = require("express");
// const path = require("path");
// const http = require("http");
// const fs = require("fs").promises;
// const { Server } = require("socket.io");
// const cleanup = require("./cleanup");
// const fsExtra = require("fs-extra");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// const PORT = process.env.PORT || 3000;
// const DATA_DIR = path.join(__dirname, "data");

// fsExtra.ensureDirSync(DATA_DIR);

// const clients = new Map();

// app.use(express.json());

// const clientBuildPath = path.join(__dirname, "../build");
// app.use(express.static(clientBuildPath));

// app.get("/latest/:ip", async (req, res) => {
//   const ip = req.params.ip;
//   if (!ip || typeof ip !== "string")
//     return res.status(400).json({ message: "Invalid IP" });

//   const filePath = path.join(DATA_DIR, `${ip.replace(/\./g, "_")}.txt`);
//   try {
//     const text = await fs.readFile(filePath, "utf8");
//     res.json({ text });
//   } catch {
//     res.json({ text: "" });
//   }
// });

// io.on("connection", (socket) => {
//   console.log("🟢 Connected:", socket.id);

//   socket.on("registerIP", async (ip) => {
//     if (!ip || typeof ip !== "string") {
//       socket.emit("errorMsg", "Invalid IP detected.");
//       return;
//     }

//     clients.set(socket.id, { ip });
//     console.log(`✅ Registered IP for ${socket.id}: ${ip}`);

//     const filePath = path.join(DATA_DIR, `${ip.replace(/\./g, "_")}.txt`);
//     try {
//       const text = await fs.readFile(filePath, "utf8");
//       socket.emit("newText", text);
//     } catch {
//       socket.emit("newText", "");
//     }
//   });

//   socket.on("shareText", async (text) => {
//     const sender = clients.get(socket.id);
//     if (!sender || !sender.ip) return;

//     const ipSafe = sender.ip.replace(/\./g, "_");
//     const filePath = path.join(DATA_DIR, `${ipSafe}.txt`);
//     try {
//       await fs.writeFile(filePath, text, "utf8");
//     } catch (err) {
//       console.error("❌ Error saving text:", err);
//     }

//     clients.forEach((client, id) => {
//       if (client.ip === sender.ip) io.to(id).emit("newText", text);
//     });
//   });

//   socket.on("disconnect", () => {
//     const info = clients.get(socket.id);
//     if (info) console.log(`🔴 ${socket.id} (IP: ${info.ip}) disconnected`);
//     clients.delete(socket.id);
//   });
// });

// setInterval(() => cleanup(DATA_DIR), 30 * 60 * 1000);

// app.use((req, res) => {
//   res.sendFile(path.join(clientBuildPath, "index.html"));
// });
// server.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
//   console.log(`📁 Data directory: ${DATA_DIR}`);
// });

require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const fs = require("fs").promises;
const { Server } = require("socket.io");
const cleanup = require("./cleanup");
const fsExtra = require("fs-extra");


// ✅ Added: Multer for file uploads
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");

// ✅ Added: Upload directory for files
const UPLOAD_DIR = path.join(__dirname, "uploads");
fsExtra.ensureDirSync(DATA_DIR);
fsExtra.ensureDirSync(UPLOAD_DIR);

const clients = new Map();

app.use(express.json());

// ✅ Serve frontend build
const clientBuildPath = path.join(__dirname, "../build");
app.use(express.static(clientBuildPath));

// ✅ Configure Multer storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ip = req.body.ip?.replace(/\./g, "_");
    if (!ip) return cb(new Error("Missing IP"));
    const userDir = path.join(UPLOAD_DIR, ip);
    fsExtra.ensureDirSync(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  },
});
const upload = multer({ storage });

// ✅ REST route to get latest shared text
app.get("/latest/:ip", async (req, res) => {
  const ip = req.params.ip;
  if (!ip || typeof ip !== "string")
    return res.status(400).json({ message: "Invalid IP" });

  const filePath = path.join(DATA_DIR, `${ip.replace(/\./g, "_")}.txt`);
  try {
    const text = await fs.readFile(filePath, "utf8");
    res.json({ text });
  } catch {
    res.json({ text: "" });
  }
});

// ✅ New route for file upload (POST /upload)
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const ip = req.body.ip;
    if (!ip) return res.status(400).json({ message: "Missing IP" });

    const fileInfo = {
      name: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${ip.replace(/\./g, "_")}/${req.file.filename}`,
      time: new Date().toISOString(),
    };
      console.log("✅ File uploaded:", fileInfo);

    // Broadcast to other clients with same IP
    clients.forEach((client, id) => {
      if (client.ip === ip) io.to(id).emit("newFile", fileInfo);
    });

    res.json({ success: true, file: fileInfo });
  } catch (err) {
    console.error("❌ File upload error:", err);
    res.status(500).json({ message: "File upload failed" });
  }
});

// ✅ Serve uploaded files statically
app.use("/uploads", express.static(UPLOAD_DIR));

// ✅ Socket.io handling for text + file updates
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  socket.on("registerIP", async (ip) => {
    if (!ip || typeof ip !== "string") {
      socket.emit("errorMsg", "Invalid IP detected.");
      return;
    }

    clients.set(socket.id, { ip });
    console.log(`✅ Registered IP for ${socket.id}: ${ip}`);

    const filePath = path.join(DATA_DIR, `${ip.replace(/\./g, "_")}.txt`);
    try {
      const text = await fs.readFile(filePath, "utf8");
      socket.emit("newText", text);
    } catch {
      socket.emit("newText", "");
    }

    // ✅ Send list of previously uploaded files for this IP
    const ipSafe = ip.replace(/\./g, "_");
    const userDir = path.join(UPLOAD_DIR, ipSafe);
    try {
      const files = await fs.readdir(userDir);
      const fileInfos = files.map((f) => ({
        name: f,
        url: `/uploads/${ipSafe}/${f}`,
      }));
      socket.emit("fileList", fileInfos);
    } catch {
      socket.emit("fileList", []);
    }
  });

  socket.on("shareText", async (text) => {
    const sender = clients.get(socket.id);
    if (!sender || !sender.ip) return;

    const ipSafe = sender.ip.replace(/\./g, "_");
    const filePath = path.join(DATA_DIR, `${ipSafe}.txt`);
    try {
      await fs.writeFile(filePath, text, "utf8");
    } catch (err) {
      console.error("❌ Error saving text:", err);
    }

    clients.forEach((client, id) => {
      if (client.ip === sender.ip) io.to(id).emit("newText", text);
    });
  });

  // ✅ New socket event for direct file metadata sharing (optional)
  socket.on("shareFileMeta", (fileInfo) => {
    const sender = clients.get(socket.id);
    if (!sender || !sender.ip) return;

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

// ✅ Periodic cleanup for old text/files
setInterval(() => cleanup(DATA_DIR), 30 * 60 * 1000);

app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log(`📂 Upload directory: ${UPLOAD_DIR}`);
});
