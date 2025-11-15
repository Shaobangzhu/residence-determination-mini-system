import React from 'react';
import type { DecisionMessage } from '../types/message-types';

type Props = {
  message: DecisionMessage;
};

export const DecisionCard: React.FC<Props> = ({ message }) => {
  return (
    <div className="decision-card">
      <p>
        <strong>Decision:</strong>{' '}
        <span className="decision-status">
          {message.decision.status === 'resident'
            ? 'California Resident'
            : message.decision.status === 'nonresident'
            ? 'Nonresident'
            : 'Needs Review'}
        </span>
      </p>
      <p>
        <strong>Confidence:</strong> {message.confidence.toFixed(2)}
      </p>
      <div className="decision-factors">
        <strong>Key Factors:</strong>
        <ul>
          {message.keyFactors.map((f, idx) => (
            <li key={idx}>{f}</li>
          ))}
        </ul>
      </div>
      {message.explanation && (
        <p className="decision-expl">{message.explanation}</p>
      )}
      <p className="decision-note">
        This is a demo classification and not official residency determination.
      </p>
    </div>
  );
};