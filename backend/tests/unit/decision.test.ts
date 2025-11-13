import { decideResidency } from '../../src/core/decision';
import { StudentInput } from '../../src/core/types';

describe('decideResidency', () => {
  it('resident: 12+ months & ties>=2', () => {
    const input: StudentInput = {
      age: 22,
      monthsInCA: 14,
      hasCADriverLicense: true,
      registeredToVoteInCA: true,
      filesCATaxes: false,
      financiallyIndependent: true
    };
    const result = decideResidency(input);
    expect(result.status).toBe('resident');
  });

  it('nonresident: <6 months & ties<2', () => {
    const input: StudentInput = {
      age: 20,
      monthsInCA: 3,
      hasCADriverLicense: false,
      registeredToVoteInCA: false,
      filesCATaxes: false,
      financiallyIndependent: false
    };
    const result = decideResidency(input);
    expect(result.status).toBe('nonresident');
  });

  it('needs_review: mixed conditions', () => {
    const input: StudentInput = {
      age: 25,
      monthsInCA: 9,
      hasCADriverLicense: true,
      registeredToVoteInCA: true,
      filesCATaxes: false,
      financiallyIndependent: false
    };
    const result = decideResidency(input);
    expect(result.status).toBe('needs_review');
  });
});
