import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatInputBar } from "../../../src/components/ChatInputBar";

describe("ChatInputBar", () => {
  it("renders input and send button with placeholder", () => {
    const mockSetInput = vi.fn();
    const mockOnSend = vi.fn();

    render(
      <ChatInputBar
        input=""
        setInput={mockSetInput}
        loading={false}
        placeholder="Type here..."
        onSend={mockOnSend}
      />
    );

    const input = screen.getByPlaceholderText(/type here/i);
    const button = screen.getByRole("button", { name: /send/i });

    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled(); // 空字符串时禁用
  });

  it("calls setInput when user types", () => {
    const mockSetInput = vi.fn();
    const mockOnSend = vi.fn();

    render(
      <ChatInputBar
        input=""
        setInput={mockSetInput}
        loading={false}
        placeholder="Type here..."
        onSend={mockOnSend}
      />
    );

    const input = screen.getByPlaceholderText(/type here/i);
    fireEvent.change(input, { target: { value: "hello" } });

    expect(mockSetInput).toHaveBeenCalledWith("hello");
  });

  it("calls onSend when clicking Send with non-empty input", () => {
    const mockSetInput = vi.fn();
    const mockOnSend = vi.fn();

    render(
      <ChatInputBar
        input="19"
        setInput={mockSetInput}
        loading={false}
        placeholder="Type here..."
        onSend={mockOnSend}
      />
    );

    const button = screen.getByRole("button", { name: /send/i });
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(mockOnSend).toHaveBeenCalled();
  });

  it("calls onSend when pressing Enter", () => {
    const mockSetInput = vi.fn();
    const mockOnSend = vi.fn();

    render(
      <ChatInputBar
        input="19"
        setInput={mockSetInput}
        loading={false}
        placeholder="Type here..."
        onSend={mockOnSend}
      />
    );

    const input = screen.getByPlaceholderText(/type here/i);
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockOnSend).toHaveBeenCalled();
  });

  it("disables input and button when loading", () => {
    const mockSetInput = vi.fn();
    const mockOnSend = vi.fn();

    render(
      <ChatInputBar
        input="something"
        setInput={mockSetInput}
        loading={true}
        placeholder="Type here..."
        onSend={mockOnSend}
      />
    );

    const input = screen.getByPlaceholderText(/type here/i);
    const button = screen.getByRole("button"); // 不再指定 name

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });
});
