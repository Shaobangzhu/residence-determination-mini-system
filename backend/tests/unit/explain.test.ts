import { explainDecision } from '../../src/core/explain';
import { decideResidency } from '../../src/core/decision';
import { StudentInput } from '../../src/core/types';

test('explainDecision returns readable text', () => {
  const input: StudentInput = {
    age: 22,
    monthsInCA: 14,
    hasCADriverLicense: true,
    registeredToVoteInCA: true,
    filesCATaxes: false,
  };
  const decision = decideResidency(input);
  const text = explainDecision(input, decision);
  expect(text).toMatch(/resident/i);
});
