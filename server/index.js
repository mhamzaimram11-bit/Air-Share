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

fsExtra.ensureDirSync(DATA_DIR);

const clients = new Map();

app.use(express.json());

const clientBuildPath = path.join(__dirname, "../build");
app.use(express.static(clientBuildPath));

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

setInterval(() => cleanup(DATA_DIR), 30 * 60 * 1000);

app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
});
