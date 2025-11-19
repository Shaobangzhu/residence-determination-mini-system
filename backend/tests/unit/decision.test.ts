import { decideResidency } from "../../src/core/decision";
import type { StudentInput } from "../../src/core/types";

// Base template for StudentInput so tests only override what they need
const baseInput: StudentInput = {
  age: 18,
  monthsInCA: 0,
  hasCADriverLicense: false,
  registeredToVoteInCA: false,
  filesCATaxes: false,
};

function makeInput(overrides: Partial<StudentInput>): StudentInput {
  return { ...baseInput, ...overrides };
}

describe("decideResidency", () => {
  it("classifies as resident when monthsInCA >= 12 and at least 2 CA ties", () => {
    const input = makeInput({
      monthsInCA: 12,
      hasCADriverLicense: true,
      registeredToVoteInCA: true,
    });

    const decision = decideResidency(input);

    expect(decision.status).toBe("resident");
    expect(decision.reasons).toContain(
      "Lived in California for 12 months or more and has at least two California ties."
    );
  });

  it("classifies as nonresident when monthsInCA < 6 even if ties are strong", () => {
    const input = makeInput({
      monthsInCA: 5,
      hasCADriverLicense: true,
      registeredToVoteInCA: true,
      filesCATaxes: true,
    });

    const decision = decideResidency(input);

    expect(decision.status).toBe("nonresident");
    expect(decision.reasons).toContain(
      "Lived in California for less than 6 months."
    );
    // Ties are fine here, so we should NOT see the ties reason
    expect(decision.reasons).not.toContain(
      "Has fewer than two California ties."
    );
  });

  it("classifies as nonresident when there are fewer than 2 CA ties, even with long stay", () => {
    const input = makeInput({
      monthsInCA: 24,
      hasCADriverLicense: true,
      registeredToVoteInCA: false,
      filesCATaxes: false, // only 1 tie
    });

    const decision = decideResidency(input);

    expect(decision.status).toBe("nonresident");
    expect(decision.reasons).toContain("Has fewer than two California ties.");
    // Months are OK here, so we should NOT see the months<6 reason
    expect(decision.reasons).not.toContain(
      "Lived in California for less than 6 months."
    );
  });

  it("classifies as nonresident when both monthsInCA < 6 and ties < 2", () => {
    const input = makeInput({
      monthsInCA: 3,
      hasCADriverLicense: false,
      registeredToVoteInCA: false,
      filesCATaxes: false, // 0 ties
    });

    const decision = decideResidency(input);

    expect(decision.status).toBe("nonresident");
    expect(decision.reasons).toContain(
      "Lived in California for less than 6 months."
    );
    expect(decision.reasons).toContain("Has fewer than two California ties.");
  });

  it("classifies as needs_review when monthsInCA is between 6 and 12 and ties >= 2", () => {
    const input = makeInput({
      monthsInCA: 8,
      hasCADriverLicense: true,
      registeredToVoteInCA: true,
      filesCATaxes: false, // 2 ties
    });

    const decision = decideResidency(input);

    expect(decision.status).toBe("needs_review");
    expect(decision.reasons).toContain(
      "Have more than two California ties, but lived in California between 6-12 months"
    );
  });

  it("treats boundary of 6 months with >= 2 ties as needs_review", () => {
    const input = makeInput({
      monthsInCA: 6,
      hasCADriverLicense: true,
      registeredToVoteInCA: true,
    });

    const decision = decideResidency(input);

    expect(decision.status).toBe("needs_review");
  });

  it("treats boundary of 11 months with >= 2 ties as needs_review", () => {
    const input = makeInput({
      monthsInCA: 11,
      hasCADriverLicense: true,
      registeredToVoteInCA: true,
    });

    const decision = decideResidency(input);

    expect(decision.status).toBe("needs_review");
  });
});
