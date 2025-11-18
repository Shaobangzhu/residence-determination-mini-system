import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DecisionCard } from '../../../src/components/DecisionCard';
import type { DecisionMessage } from '../../../src/types/message-types';

const baseMessage: DecisionMessage = {
  id: '1',
  sender: 'bot',
  kind: 'decision',
  decision: {
    status: 'resident',
    reasons: ['lives in CA > 12 months'],
  },
  confidence: 0.92,
  keyFactors: [
    'Physical Presence ≥ 12 months',
    'Intent: 2 residency tie(s) found',
    'CA Driver License: Found',
  ],
  explanations: 'System thinks you likely qualify as a California resident.',
  aiExplanation: 'AI explanation from GPT: you appear to meet the residency requirements.',
};

describe('DecisionCard', () => {
  it('renders decision status, confidence, factors, and both explanations', () => {
    render(<DecisionCard message={baseMessage} />);

    // Decision + label
    expect(screen.getByText(/Decision:/i)).toBeInTheDocument();
    expect(screen.getByText('California Resident')).toBeInTheDocument();

    // Confidence
    expect(screen.getByText(/Confidence:/i)).toBeInTheDocument();
    expect(screen.getByText('0.92')).toBeInTheDocument();

    // Key factors
    expect(screen.getByText(/Key Factors:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Physical Presence ≥ 12 months/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/CA Driver License: Found/i)).toBeInTheDocument();

    // System explanation section
    expect(screen.getByText(/System Explanation:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/System thinks you likely qualify as a California resident/i)
    ).toBeInTheDocument();

    // AI explanation section
    expect(screen.getByText(/AI Explanation:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/AI explanation from GPT: you appear to meet the residency requirements/i)
    ).toBeInTheDocument();

    // Demo note
    expect(
      screen.getByText(/This is a demo classification and not official residency determination/i)
    ).toBeInTheDocument();
  });

  it('renders different label for nonresident', () => {
    const msg: DecisionMessage = {
      ...baseMessage,
      decision: { ...baseMessage.decision, status: 'nonresident' },
    };

    render(<DecisionCard message={msg} />);

    expect(screen.getByText(/Nonresident/i)).toBeInTheDocument();
  });
});
