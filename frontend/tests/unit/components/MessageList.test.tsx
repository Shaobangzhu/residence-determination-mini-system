import "@testing-library/jest-dom";
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from '../../../src/components/MessageList';
import type { Message } from '../../../src/types/message-types';

const messages: Message[] = [
  {
    id: '1',
    sender: 'bot',
    kind: 'text',
    text: "Hello! I'm the RDS Assistant."
  },
  {
    id: '2',
    sender: 'user',
    kind: 'text',
    text: 'Hi, I am a new student.'
  },
  {
    id: '3',
    sender: 'bot',
    kind: 'decision',
    decision: {
      status: 'resident',
      reasons: ['test reason']
    },
    explanation: 'Looks like you qualify.',
    confidence: 0.9,
    keyFactors: ['Physical Presence ≥ 12 months']
  }
];

describe('MessageList', () => {
  it('renders user and bot text messages', () => {
    render(<MessageList messages={messages} />);

    expect(
      screen.getByText(/Hello! I'm the RDS Assistant/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Hi, I am a new student/i)
    ).toBeInTheDocument();

    // Bot & user avatars (alt text)
    expect(screen.getAllByAltText(/RDS Bot/i).length).toBeGreaterThan(0);
    expect(screen.getAllByAltText(/User/i).length).toBeGreaterThan(0);
  });

  it('renders decision card for decision message', () => {
    render(<MessageList messages={messages} />);

    expect(screen.getByText(/Decision:/i)).toBeInTheDocument();
    expect(screen.getByText(/California Resident|Nonresident|Needs Review/i)).toBeInTheDocument();
    expect(screen.getByText(/Physical Presence ≥ 12 months/i)).toBeInTheDocument();
  });
});
