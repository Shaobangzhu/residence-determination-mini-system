import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatStateMachine } from "../../../src/hooks/useChatStateMachine";
import { TextMessage } from "../../../src/types/message-types";
import { ApiResponse } from "../../../src/types/api-types";

describe("useChatStateMachine", () => {
  it("initializes with welcome messages and askAge step", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const { result } = renderHook(() => useChatStateMachine());

    expect(result.current.messages.length).toBe(2);

    const texts = result.current.messages.map((m) =>
      m.kind === "text" ? m.text : ""
    );

    expect(texts.some((t) => /RDS Assistant for UC Riverside/i.test(t))).toBe(
      true
    );

    expect(
      texts.some((t) => /how old will you be when the term starts/i.test(t))
    ).toBe(true);

    expect(result.current.step).toBe("askAge");
    expect(result.current.loading).toBe(false);
  });

  it("moves from askAge to askMonths when valid age is submitted", async () => {
    const { result } = renderHook(() => useChatStateMachine());

    act(() => {
      result.current.setInput("19");
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.step).toBe("askMonths");

    const botTexts = result.current.messages
      .filter((m): m is TextMessage => m.sender === "bot" && m.kind === "text")
      .map((m) => m.text);

    expect(
      botTexts.some((t) =>
        /how many months have you physically lived in california/i.test(t)
      )
    ).toBe(true);
  });

  it("shows validation message when invalid age is entered", async () => {
    const { result } = renderHook(() => useChatStateMachine());

    act(() => {
      result.current.setInput("not-a-number");
    });

    await act(async () => {
      await result.current.handleSend();
    });

    const botTexts = result.current.messages
      .filter((m): m is TextMessage => m.sender === "bot" && m.kind === "text")
      .map((m) => m.text);

    expect(
      botTexts.some((t) => /please enter a valid age as a number/i.test(t))
    ).toBe(true);

    expect(result.current.step).toBe("askAge");
  });

  /*
   * Regression test:
   * Ensure that when the user answers "yes" to the tax question,
   * the latest form snapshot is sent to the backend, with filesCATaxes = true.
   */
  it('sends filesCATaxes = true to backend when user answers "yes" to the tax question', async () => {
    // Mock backend response payload using the actual ApiResponse type
    const mockResponse: ApiResponse = {
      decision: {
        status: "resident",
        reasons: [],
      },
      explanations: "dummy explanation",
      aiExplanation: "dummy ai explanation",
    };

    // Create a fetch mock that returns the mock ApiResponse
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    // Safely assign the mock fetch to globalThis without using `any`.
    // We first widen globalThis to a type that guarantees a `fetch` field,
    // then cast the mock to `typeof fetch`.
    const globalWithFetch = globalThis as unknown as {
      fetch: typeof fetch;
    };
    globalWithFetch.fetch = mockFetch as unknown as typeof fetch;

    const { result } = renderHook(() => useChatStateMachine());

    // 1) askAge → input 19
    act(() => {
      result.current.setInput("19");
    });
    await act(async () => {
      await result.current.handleSend();
    });

    // 2) askMonths → input 14
    act(() => {
      result.current.setInput("14");
    });
    await act(async () => {
      await result.current.handleSend();
    });

    // 3) askCADriver → input yes
    act(() => {
      result.current.setInput("yes");
    });
    await act(async () => {
      await result.current.handleSend();
    });

    // 4) askVote → input yes
    act(() => {
      result.current.setInput("yes");
    });
    await act(async () => {
      await result.current.handleSend();
    });

    // 5) askTax → input yes (this should trigger the backend call)
    act(() => {
      result.current.setInput("yes");
    });
    await act(async () => {
      await result.current.handleSend();
    });

    // Ensure exactly one backend request was made
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Inspect the request body that was sent to the backend
    const fetchCallArgs = mockFetch.mock.calls[0];
    const requestInit = fetchCallArgs[1] as RequestInit;
    const payload = JSON.parse(requestInit.body as string);

    // Verify that the latest answer is reflected in the payload
    expect(payload.filesCATaxes).toBe(true);
  });
});
