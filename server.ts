import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for mocked tools
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mocked MCP tools
  app.post("/api/mcp/get_mft", (req, res) => {
    res.json({ artifact: "$MFT parsed", status: "success", events: 1400 });
  });

  app.post("/api/mcp/get_prefetch", (req, res) => {
    res.json({ traces: ["powershell.exe", "cmd.exe"], execution_count: 5 });
  });

  app.post("/api/mcp/analyze_memory", (req, res) => {
    res.json({ injection_detected: true, process: "lsass.exe", anomaly_score: 95 });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
