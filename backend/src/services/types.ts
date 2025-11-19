import { Decision } from "../core/types";

export type DecisionComputationResult = {
  decision: Decision;
  systemExplanation: string;
  aiExplanation?: string;
};