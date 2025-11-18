import { Router } from "express";
import { StudentInputSchema, Decision } from "../core/types";
import { decideResidency } from "../core/decision";
import { explainDecision } from "../core/explain";
import { generateAiExplanation } from "../ai";
import { saveDecisionRecord } from "../persistence";

const router = Router();

/**
 * POST /api/decide
 * Body: StudentInput
 * Query: ?explain=true to include explanation text
 */
router.post('/decide', async (req, res) => {
    const parsed = StudentInputSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid input',
            issues: parsed.error.format(),
        });
    }

    const input = parsed.data;
    const decision: Decision = decideResidency(input);

    // Generate system explanation
    const systemExplanation = explainDecision(input, decision);

    // Check if AI explanation is requested
    const explainFlag = String(req.query.explain ?? "true").toLowerCase() === 'true';

    // Generate AI explanation if requested
    let aiExplanation: string | undefined;

    // Save the decision record (including AI explanation if generated)
    try {
      aiExplanation = await generateAiExplanation(input, decision);
    } catch (error) {
      console.error("Error generating AI explanation:", error);
    }

    // Write to database
    try {
      saveDecisionRecord({
        input,
        decision,
        systemExplanation,
        aiExplanation,
      });
    } catch (error) {
      console.error("Error saving decision record:", error);
    }

    // Build response
    const responseBody: {
      decision: Decision;
      explanations?: string;
      aiExplanation?: string;
    } = {
      decision,
    };

    // Include explanations if requested
    if (explainFlag) {
      responseBody.explanations = systemExplanation;
      responseBody.aiExplanation = aiExplanation;
    }

    return res.json(responseBody);
});

export default router;