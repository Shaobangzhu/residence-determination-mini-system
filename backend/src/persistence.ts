// backend/src/persistence.ts
import { db } from "./db";
import type { StudentInput, Decision } from "./core/types";

type SaveDecisionParams = {
  input: StudentInput;
  decision: Decision;
  systemExplanation: string;
  aiExplanation?: string;
};

const insertStmt = db.prepare(`
  INSERT INTO decision_records (
    created_at,
    age,
    months_in_ca,
    has_ca_driver_license,
    registered_to_vote_in_ca,
    files_ca_taxes,
    financially_independent,
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
    @financiallyIndependent,
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

  insertStmt.run({
    age: input.age,
    monthsInCA: input.monthsInCA,
    hasCADriverLicense: input.hasCADriverLicense ? 1 : 0,
    registeredToVoteInCA: input.registeredToVoteInCA ? 1 : 0,
    filesCATaxes: input.filesCATaxes ? 1 : 0,
    financiallyIndependent: input.financiallyIndependent ? 1 : 0,
    status: decision.status,
    reasonsJson: JSON.stringify(decision.reasons),
    systemExplanation,
    aiExplanation: aiExplanation ?? null,
  });
}
