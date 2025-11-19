import { Router } from "express";
import { StudentInputSchema, Decision } from "../core/types";
import { computeDecisionResult } from "../services/decision-compute.service";
import { persistDecisionRecord } from "../services/decision-record.service";

const router = Router();

/**
 * POST /api/decide
 * Body: StudentInput
 * Query: ?explain=true to include explanation text
 */
router.post("/decision", async (req, res) => {
  const parsed = StudentInputSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid input",
      issues: parsed.error.format(),
    });
  }

  const input = parsed.data;

  const explainFlag =
    String(req.query.explain ?? "true").toLowerCase() === "true";

  // Compute decision and explanations
  const result = await computeDecisionResult(input, {
    withAiExplanation: explainFlag,
  });

  // Write to database
  try {
    persistDecisionRecord(input, result);
  } catch (error) {
    console.error("Error saving decision record:", error);
  }

  // Build response
  const responseBody: {
    decision: Decision;
    explanations?: string;
    aiExplanation?: string;
  } = {
    decision: result.decision,
  };

  // Include explanations if requested
  if (explainFlag) {
    responseBody.explanations = result.systemExplanation;
    responseBody.aiExplanation = result.aiExplanation;
  }

  return res.json(responseBody);
});

export default router;
