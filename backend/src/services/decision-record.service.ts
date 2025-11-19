import type { StudentInput } from "../core/types";
import type { DecisionComputationResult } from "./types";
import { saveDecisionRecord } from "../persistence";

/**
 * Persist a fully computed residency decision record.
 *
 * This service acts as the persistence layer for a completed decision result.
 * The caller provides:
 *   - the original validated StudentInput, and
 *   - the computed decision results (system + optional AI explanation).
 *
 * Internally, this function delegates to the persistence module,
 * keeping the database details encapsulated and hidden from upper layers.
 *
 * Note:
 * - This function only performs a write operation; it does not calculate
 *   any decision logic.
 * - Any DB errors should be handled by the caller if needed.
 */
export function persistDecisionRecord(
  input: StudentInput,
  result: DecisionComputationResult
): void {
  const { decision, systemExplanation, aiExplanation } = result;

  // Delegate to the lower-level persistence utility (SQLite implementation)
  saveDecisionRecord({
    input,
    decision,
    systemExplanation,
    aiExplanation,
  });
}
