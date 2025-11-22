import { StudentInputPayload } from "../../../src/types/student-input-payload";
import { ApiDecision } from "../../../src/types/api-types";
import { describe, it, expect } from "vitest";
import { computeConfidence, buildKeyFactors } from "../../../src/utils/decisionHelpers";

const basePayload: StudentInputPayload = {
  age: 20,
  monthsInCA: 0,
  hasCADriverLicense: false,
  registeredToVoteInCA: false,
  filesCATaxes: false,
};

const makeDecision = (status: ApiDecision["status"]): ApiDecision => ({
  status,
  reasons: [],
});

describe("computeConfidence", () => {
  it("returns high confidence for resident", () => {
    const decision = makeDecision("resident");
    expect(computeConfidence(decision)).toBe(0.92);
  });

  it("returns mid-high confidence for nonresident", () => {
    const decision = makeDecision("nonresident");
    expect(computeConfidence(decision)).toBe(0.85);
  });

  it("returns lower confidence for needs_review", () => {
    const decision = makeDecision("needs_review");
    expect(computeConfidence(decision)).toBe(0.7);
  });

  it("falls back to default confidence for unknown status", () => {
    const decision = makeDecision("needs_review");
    expect(computeConfidence(decision)).toBe(0.7);
  });
});

describe('computeConfidence', () => {
  it('returns high confidence for resident', () => {
    const decision = makeDecision('resident');
    expect(computeConfidence(decision)).toBe(0.92);
  });

  it('returns mid-high confidence for nonresident', () => {
    const decision = makeDecision('nonresident');
    expect(computeConfidence(decision)).toBe(0.85);
  });

  it('returns lower confidence for needs_review', () => {
    const decision = makeDecision('needs_review');
    expect(computeConfidence(decision)).toBe(0.7);
  });

  it('falls back to default confidence for unknown status', () => {
    const decision = makeDecision('needs_review');
    expect(computeConfidence(decision)).toBe(0.7);
  });
});

describe('buildKeyFactors', () => {
  it('labels physical presence correctly for >= 12 months', () => {
    const payload: StudentInputPayload = {
      ...basePayload,
      monthsInCA: 13,
      hasCADriverLicense: true,
      registeredToVoteInCA: true,
      filesCATaxes: false
    };

    const decision = makeDecision('resident');
    const factors = buildKeyFactors(payload, decision);

    expect(factors[0]).toContain('≥ 12 months');
    expect(factors).toContain('CA Driver License: Found');
    expect(factors).toContain('CA Voter Registration: Found');
    expect(factors).toContain('Intent: 2 residency tie(s) found');
    expect(factors).toContain('System decision: resident');
  });

  it('labels physical presence between 6 and 12 months', () => {
    const payload: StudentInputPayload = {
      ...basePayload,
      monthsInCA: 7
    };

    const decision = makeDecision('needs_review');
    const factors = buildKeyFactors(payload, decision);

    expect(factors[0]).toContain('between 6 and 12 months');
  });

  it('labels physical presence < 6 months', () => {
    const payload: StudentInputPayload = {
      ...basePayload,
      monthsInCA: 3
    };

    const decision = makeDecision('nonresident');
    const factors = buildKeyFactors(payload, decision);

    expect(factors[0]).toContain('< 6 months');
  });

  it('counts tax filing as a residency tie', () => {
    const payload: StudentInputPayload = {
      ...basePayload,
      monthsInCA: 15,
      hasCADriverLicense: false,
      registeredToVoteInCA: false,
      filesCATaxes: true
    };

    const decision = makeDecision('resident');
    const factors = buildKeyFactors(payload, decision);

    expect(factors).toContain('Intent: 1 residency tie(s) found');
    expect(factors).toContain('CA Tax Filing: Found');
  });
});
