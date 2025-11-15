// Conversation state machine steps
export type ConversationStep =
  | "welcome"
  | "askAge"
  | "askMonths"
  | "askCADriver"
  | "askVote"
  | "askTax"
  | "askIndependent"
  | "evaluating"
  | "done";
