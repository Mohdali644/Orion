//api/src/app.ts
import express, { type Express } from "express";
import healthRoutes from "./routes/route";
import runsRoutes from "./routes/runs.routes";
import findingsRoutes from "./routes/findings.routes";
import webhookRoutes from "./routes/webhook.routes";
import repoRoutes from "./routes/repos.routes";
import notificationsRoutes from "./routes/notifications.routes";
import prReviewsRoutes from "./routes/pr-reviews.routes";
import { connectRepo, repoCallback } from "./controllers/repos.controller";
import cors from "cors";

const app: Express = express();

app.use(cors());

// ── Webhook MUST come before express.json() ───────────────────────────────────
// GitHub signs the raw request body bytes. If express.json() runs first it
// parses the body into an object and JSON.stringify() of that object won't
// match the original bytes → every signature check fails with 401.
app.use(
  "/api/v1/github/webhook",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

// ── All other routes get normal JSON parsing ──────────────────────────────────
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/v1/runs", runsRoutes);
app.use("/api/v1/findings", findingsRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/pr-reviews", prReviewsRoutes);

// These must be registered BEFORE the repos router
app.get("/api/v1/repos/connect", connectRepo);
app.get("/api/v1/repos/callback", repoCallback);

app.use("/api/v1/repos", repoRoutes);

export default app;