import express from "express";
import cors from "cors";
import decisionRouter from "./routes/decision.route";
import { saveStudentSession } from './db';

/**
 * Main application entry point for the Express Server
 */

const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// api health check
app.get("/api/health", (_req, res) => {
  res.status(200).send("OK");
});

app.use("/api", decisionRouter);

// Debug route to save a sample student session to the database
app.get("/api/debug/save-sample-to-db", (_req, res) => {
  try {
    saveStudentSession({
      created_at: new Date().toISOString(),
      age: 20,
      months_in_ca: 15,
      has_ca_driver_license: true,
      registered_to_vote_in_ca: false,
      files_ca_taxes: true,
      financially_independent: false,
      decision_status: "resident",
      decision_reasons: JSON.stringify(["debug insert"]),
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("debug save error", error);
    res.status(500).json({ ok: false, error: "DB insert failed" });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

export default app;
