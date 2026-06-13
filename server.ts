import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "OmniMind Core: Online", version: "1.0.0" });
  });

  // API Route: Contact Form Submission
  app.post("/api/contact", (req, res) => {
    const { name, email, message } = req.body;
    console.log(`Transmission received from ${name} (${email}): ${message}`);
    // Here we would implement the email notification to admin
    res.json({ success: true, message: "Pulse received by OmniMind Core." });
  });

  // API Route: AI Services (Proxies or logic)
  app.post("/api/ai/chat", (req, res) => {
    // This would handle server-side AI logic if needed
    res.json({ message: "Neural gateway active." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OmniMind Server running on http://localhost:${PORT}`);
  });
}

startServer();
