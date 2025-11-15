import type { ApiDecision } from "./api-types";

export type MessageBase = {
  id: string;
  sender: "user" | "bot";
};

export type TextMessage = MessageBase & {
  kind: "text";
  text: string;
};

export type DecisionMessage = MessageBase & {
  kind: "decision";
  decision: ApiDecision;
  explanation?: string;
  confidence: number;
  keyFactors: string[];
};

export type Message = TextMessage | DecisionMessage;
