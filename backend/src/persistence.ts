import { db } from "./db";
import type { StudentInput, Decision } from "./core/types";

// Parameters required to save a decision record.
type SaveDecisionParams = {
  input: StudentInput;
  decision: Decision;
  systemExplanation: string;
  aiExplanation?: string;
};

// Prepared statement for inserting a decision record.
const insertStatement = db.prepare(`
  INSERT INTO decision_records (
    created_at,
    age,
    months_in_ca,
    has_ca_driver_license,
    registered_to_vote_in_ca,
    files_ca_taxes,
    status,
    reasons_json,
    system_explanation,
    ai_explanation
  ) VALUES (
    datetime('now'),
    @age,
    @monthsInCA,
    @hasCADriverLicense,
    @registeredToVoteInCA,
    @filesCATaxes,
    @status,
    @reasonsJson,
    @systemExplanation,
    @aiExplanation
  );
`);

/**
 * Persist one decision record to SQLite.
 * This is synchronous but very fast for a small demo.
 */
export function saveDecisionRecord(params: SaveDecisionParams): void {
  const { input, decision, systemExplanation, aiExplanation } = params;

  insertStatement.run({
    age: input.age,
    monthsInCA: input.monthsInCA,
    hasCADriverLicense: input.hasCADriverLicense ? 1 : 0,
    registeredToVoteInCA: input.registeredToVoteInCA ? 1 : 0,
    filesCATaxes: input.filesCATaxes ? 1 : 0,
    status: decision.status,
    reasonsJson: JSON.stringify(decision.reasons),
    systemExplanation,
    aiExplanation: aiExplanation ?? null,
  });
}
