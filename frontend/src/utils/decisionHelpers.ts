import type { ApiDecision } from '../types/api-types';
import type { StudentInputPayload } from '../types/student-input-payload';

export const computeConfidence = (decision: ApiDecision): number => {
  switch (decision.status) {
    case 'resident':
      return 0.92;
    case 'nonresident':
      return 0.85;
    case 'needs_review':
    default:
      return 0.7;
  }
};

export const buildKeyFactors = (
  payload: StudentInputPayload,
  decision: ApiDecision
): string[] => {
  const factors: string[] = [];

  if (payload.monthsInCA >= 12) {
    factors.push('Physical Presence ≥ 12 months');
  } else if (payload.monthsInCA >= 6) {
    factors.push('Physical Presence between 6 and 12 months');
  } else {
    factors.push('Physical Presence < 6 months');
  }

  const ties = [
    payload.hasCADriverLicense,
    payload.registeredToVoteInCA,
    payload.filesCATaxes
  ].filter(Boolean).length;

  factors.push(`Intent: ${ties} residency tie(s) found`);

  if (payload.hasCADriverLicense) factors.push('CA Driver License: Found');
  if (payload.registeredToVoteInCA) factors.push('CA Voter Registration: Found');
  if (payload.filesCATaxes) factors.push('CA Tax Filing: Found');

  factors.push(`System decision: ${decision.status}`);

  return factors;
};
