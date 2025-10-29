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
// const io = new Server(server, {
//   cors: {
//     origin: "*", // allow React frontend
//     methods: ["GET", "POST"]
//   }
// });

// const PORT = process.env.PORT || 3000;
// const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");

// // Ensure data directory exists
// fsExtra.ensureDirSync(DATA_DIR);

// // Store connected clients
// const clients = new Map();

// // Middleware
// app.use(express.json());

// // Routes
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

// // Socket.io events
// io.on("connection", (socket) => {
//   console.log("🟢 User connected:", socket.id);

//   socket.on("registerIP", async (ip) => {
//     if (!ip || typeof ip !== "string") {
//       socket.emit("errorMsg", "Invalid IP detected.");
//       return;
//     }

//     clients.set(socket.id, { ip });
//     console.log(`✅ Socket ${socket.id} registered IP: ${ip}`);

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
//       console.error("Error saving text:", err);
//     }

//     // Emit to all sockets with same IP
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

// // Cleanup old files every 30 minutes
// setInterval(() => cleanup(DATA_DIR), 30 * 60 * 1000);

// server.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
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

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");

// ensure data folder exists
fsExtra.ensureDirSync(DATA_DIR);

// to track connected sockets and their IPs
const clients = new Map();

// middleware
app.use(express.json());

// Serve React build
const clientBuildPath = path.join(__dirname, "../build");
app.use(express.static(clientBuildPath));

// === API: get latest text for given IP ===
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

// === Socket.io events ===
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

    // broadcast updated text to all sockets for same IP
    clients.forEach((client, id) => {
      if (client.ip === sender.ip) io.to(id).emit("newText", text);
    });
  });

  socket.on("disconnect", () => {
    const info = clients.get(socket.id);
    if (info) console.log(`🔴 ${socket.id} (IP: ${info.ip}) disconnected`);
    clients.delete(socket.id);
  });
});

// run cleanup every 30 minutes
setInterval(() => cleanup(DATA_DIR), 30 * 60 * 1000);

// Serve React index.html for non-API routes
app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
});
