import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatStateMachine } from '../../../src/hooks/useChatStateMachine';
import { TextMessage } from '../../../src/types/message-types';

describe('useChatStateMachine', () => {
  it('initializes with welcome messages and askAge step', () => {
    const { result } = renderHook(() => useChatStateMachine());

    expect(result.current.messages.length).toBe(2);

    const texts = result.current.messages.map(m =>
      m.kind === 'text' ? m.text : ''
    );

    expect(
      texts.some(t => /RDS Assistant for UC Riverside/i.test(t))
    ).toBe(true);

    expect(
      texts.some(t => /how old will you be when the term starts/i.test(t))
    ).toBe(true);

    expect(result.current.step).toBe('askAge');
    expect(result.current.loading).toBe(false);
  });

  it('moves from askAge to askMonths when valid age is submitted', async () => {
    const { result } = renderHook(() => useChatStateMachine());

    act(() => {
      result.current.setInput('19');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    // 应该进入下一步 askMonths
    expect(result.current.step).toBe('askMonths');

    const botTexts = result.current.messages
      .filter((m): m is TextMessage => m.sender === 'bot' && m.kind === 'text')
      .map(m => m.text);

    expect(
      botTexts.some(t => /how many months have you physically lived in california/i.test(t))
    ).toBe(true);
  });

  it('shows validation message when invalid age is entered', async () => {
    const { result } = renderHook(() => useChatStateMachine());

    act(() => {
      result.current.setInput('not-a-number');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    const botTexts = result.current.messages
      .filter((m): m is TextMessage => m.sender === 'bot' && m.kind === 'text')
      .map(m => m.text);

    expect(
      botTexts.some(t => /please enter a valid age as a number/i.test(t))
    ).toBe(true);

    // step 不应该前进
    expect(result.current.step).toBe('askAge');
  });
});
