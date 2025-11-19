import type { StudentInput, Decision } from "../core/types";
import { decideResidency } from "../core/decision";
import { explainDecision } from "../core/explain";
import { generateAiExplanation } from "../ai";

export type DecisionComputationResult = {
  decision: Decision;
  systemExplanation: string;
  aiExplanation?: string;
};

type ComputeOptions = {
  withAiExplanation?: boolean;
};

/**
 * Compute a residency decision and its associated explanations.
 *
 * This service performs pure business logic only. It:
 *   1. Executes the core residency determination algorithm.
 *   2. Generates a deterministic, system-level explanation.
 *   3. Optionally generates an AI-based explanation (async, may fail safely).
 *
 * Note:
 * - This function does not write to the database. Persistence is handled separately.
 * - `withAiExplanation` controls whether the AI explanation is generated.
 *
 * @param input   Parsed and validated student input payload.
 * @param options Optional configuration (e.g., whether to generate AI explanation).
 * @returns       A DecisionComputationResult containing decision + explanations.
 */
export async function computeDecisionResult(
  input: StudentInput,
  options: ComputeOptions = { withAiExplanation: true }
): Promise<DecisionComputationResult> {
  const { withAiExplanation = true } = options;

  // 1. Core residency decision (pure function)
  const decision: Decision = decideResidency(input);

  // 2. System-generated explanation (deterministic, synchronous)
  const systemExplanation = explainDecision(input, decision);

  // 3. Optional AI-generated explanation (best-effort)
  let aiExplanation: string | undefined;

  if (withAiExplanation) {
    try {
      aiExplanation = await generateAiExplanation(input, decision);
    } catch (error) {
      console.error("Error generating AI explanation:", error);
    }
    // Failure is non-blocking; we fall back to only systemExplanation
  }

  return {
    decision,
    systemExplanation,
    aiExplanation,
  };
}
