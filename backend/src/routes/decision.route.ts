import { Router } from "express";
import { StudentInputSchema } from "../core/types";
import { decideResidency } from "../core/decision";
import { explainDecision } from "../core/explain";

const router = Router();

/**
 * POST /api/decide
 * Body: StudentInput
 * Query: ?explain=true to include explanation text
 */
router.post('/decide', (req, res) => {
    const parsed = StudentInputSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid input',
            issues: parsed.error.format()
        });
    }

    const input = parsed.data;
    const decision = decideResidency(input);

    // If explanation is requested
    if (String(req.query.explain).toLowerCase() === 'true') {
        const explanation = explainDecision(input, decision);
        return res.json({ decision, explanation });
    }

    // Basic response
    return res.json({ decision });
});

export default router;