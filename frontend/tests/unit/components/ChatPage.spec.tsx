import "@testing-library/jest-dom";
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatPage } from '../../../src/components/ChatPage';
import type { ConversationStep } from "../../../src/types/conversation-step";
import * as hookModule from '../../../src/hooks/useChatStateMachine';

describe('ChatPage', () => {
  it('renders header and passes messages to MessageList', () => {
    // 这里用一个简单的 mock，避免真正发请求
    vi.spyOn(hookModule, 'useChatStateMachine').mockReturnValue({
      messages: [
        {
          id: '1',
          sender: 'bot',
          kind: 'text',
          text: 'Mock hello from RDS Assistant'
        }
      ],
      input: '',
      setInput: vi.fn(),
      loading: false,
      placeholder: 'Mock placeholder',
      handleSend: vi.fn(),
      step: 'askAgent' as ConversationStep
    });

    render(<ChatPage />);

    expect(
      screen.getByText(/Residency Determination System — UC Riverside/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/RDS Assistant · Demo/i)).toBeInTheDocument();
    expect(screen.getByText('UCR', { exact: true })).toBeInTheDocument();

    expect(
      screen.getByText(/Mock hello from RDS Assistant/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Demo only · Not official UCR residency guidance/i)
    ).toBeInTheDocument();
  });

  it('renders input bar with mocked placeholder', () => {
    vi.spyOn(hookModule, 'useChatStateMachine').mockReturnValue({
      messages: [],
      input: '',
      setInput: vi.fn(),
      loading: false,
      placeholder: 'Mock placeholder',
      handleSend: vi.fn(),
      step: 'askAgent' as ConversationStep
    });

    render(<ChatPage />);

    const input = screen.getByPlaceholderText(/Mock placeholder/i);
    expect(input).toBeInTheDocument();
  });

  it('clicking Send triggers handleSend from hook', () => {
    const handleSendMock = vi.fn();

    // ⭐ 这一步是真正关键：把 useChatStateMachine “换成” 我们想要的返回值
    vi.spyOn(hookModule, 'useChatStateMachine').mockReturnValue({
      messages: [
        {
          id: '1',
          sender: 'bot',
          kind: 'text',
          text: 'Mock hello from RDS Assistant'
        }
      ],
      input: '19',              // 非空 => 按钮不会 disabled
      setInput: vi.fn(),
      loading: false,
      placeholder: 'Mock placeholder',
      handleSend: handleSendMock,
      step: 'askAgent' as ConversationStep
    });

    render(<ChatPage />);

    const button = screen.getByRole('button', { name: /send/i });
    fireEvent.click(button);

    expect(handleSendMock).toHaveBeenCalled();
  });
});
