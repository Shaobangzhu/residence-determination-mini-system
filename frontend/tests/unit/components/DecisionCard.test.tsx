import "@testing-library/jest-dom";
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
    reasons: ['lives in CA > 12 months']
  },
  explanation: 'You appear to meet the requirements for California residency.',
  confidence: 0.92,
  keyFactors: [
    'Physical Presence ≥ 12 months',
    'Intent: 2 residency tie(s) found',
    'CA Driver License: Found'
  ]
};

describe('DecisionCard', () => {
  it('renders decision status, confidence and factors', () => {
    render(<DecisionCard message={baseMessage} />);

    expect(screen.getByText(/Decision:/i)).toBeInTheDocument();
    expect(screen.getByText(/California Resident/i)).toBeInTheDocument();

    expect(screen.getByText(/Confidence:/i)).toBeInTheDocument();
    expect(screen.getByText('0.92')).toBeInTheDocument();

    expect(screen.getByText(/Key Factors:/i)).toBeInTheDocument();
    expect(screen.getByText(/Physical Presence ≥ 12 months/i)).toBeInTheDocument();
    expect(screen.getByText(/CA Driver License: Found/i)).toBeInTheDocument();

    expect(
      screen.getByText(/You appear to meet the requirements/i)
    ).toBeInTheDocument();
  });

  it('renders different label for nonresident', () => {
    const msg: DecisionMessage = {
      ...baseMessage,
      decision: { ...baseMessage.decision, status: 'nonresident' }
    };

    render(<DecisionCard message={msg} />);

    expect(screen.getByText(/Nonresident/i)).toBeInTheDocument();
  });
});
