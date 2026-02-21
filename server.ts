import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./src/server/db.ts";
import authRoutes from "./src/server/routes/auth.ts";
import raffleRoutes from "./src/server/routes/raffles.ts";
import ticketRoutes from "./src/server/routes/tickets.ts";
import dashboardRoutes from "./src/server/routes/dashboard.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  initDb();

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/raffles", raffleRoutes);
  app.use("/api/tickets", ticketRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
