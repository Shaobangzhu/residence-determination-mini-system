import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiResponse } from "../../../src/types/api-types";
import { decideResidency } from "../../../src/api/decisionApi";
import type { StudentInputPayload } from "../../../src/types/student-input-payload";
import { DECIDE_ENDPOINT } from "../../../src/constants/endpoints";

const payload: StudentInputPayload = {
  age: 20,
  monthsInCA: 14,
  hasCADriverLicense: true,
  registeredToVoteInCA: true,
  filesCATaxes: true,
};

const mockApiResponse: ApiResponse = {
  decision: {
    status: "resident",
    reasons: ["dummy reason"],
  },
  explanations: "system explanation",
  aiExplanation: "ai explanation",
};

describe("decideResidency", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("calls backend correctly and returns ApiResponse", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockApiResponse),
    } as unknown as Response);

    const result = await decideResidency(payload);

    expect(fetchMock).toHaveBeenCalledWith(DECIDE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(mockApiResponse);
  });

  it("throws backend error message when response is not ok", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: "Validation failed" }),
    } as unknown as Response);

    await expect(decideResidency(payload)).rejects.toThrow("Validation failed");
  });

  it("throws generic error when json parsing fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error("invalid json")),
    } as unknown as Response);

    await expect(decideResidency(payload)).rejects.toThrow(
      "Request failed with status 500"
    );
  });
});
