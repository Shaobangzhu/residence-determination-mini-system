import type { DecisionStatus } from "./decision-status";

export type ApiDecision = {
    status: DecisionStatus;
    reasons: string[];
};

export type ApiResponse = {
    decision: ApiDecision;
    explanation?: string;
}