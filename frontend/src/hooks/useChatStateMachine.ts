import { useEffect, useState } from 'react';

import type { ApiDecision, ApiResponse } from '../types/api-types';
import type { ConversationStep } from '../types/conversation-step';
import type { Message } from '../types/message-types';
import { type StudentInputPayload, initialForm } from '../types/student-input-payload';

import { DECIDE_ENDPOINT } from '../constants/endpoints';

/**
 * Chat state machine hook
 *
 * - Manages conversation step (welcome → questions → evaluating → done)
 * - Stores user answers in `form`
 * - Keeps full message history for UI
 * - Calls backend `/api/decide` and turns response into a decision card
 */
export function useChatStateMachine() {
  // All messages shown in the chat window (user + bot + decision card)
  const [messages, setMessages] = useState<Message[]>([]);
  // Current text in the input box
  const [input, setInput] = useState('');
  // Structured student input that will be sent to the backend
  const [form, setForm] = useState<StudentInputPayload>(initialForm);
  // High-level conversation state
  const [step, setStep] = useState<ConversationStep>('welcome');
  // Whether we are currently calling the backend / evaluating
  const [loading, setLoading] = useState(false);

  // On first mount, push the initial welcome + first question messages
  useEffect(() => {
    const firstBotMessages: Message[] = [
      {
        id: crypto.randomUUID(),
        sender: 'bot',
        kind: 'text',
        text: "Hello! I'm the RDS Assistant for UC Riverside. I’ll ask a few questions to estimate residency for tuition purposes."
      },
      {
        id: crypto.randomUUID(),
        sender: 'bot',
        kind: 'text',
        text: 'First, how old will you be when the term starts? (Just type a number, e.g., 19.)'
      }
    ];
    setMessages(firstBotMessages);
    setStep('askAge');
  }, []);

  // Append a user text message to the message list
  const pushUserText = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'user',
        kind: 'text',
        text
      }
    ]);
  };

  // Append a bot text message to the message list
  const pushBotText = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'bot',
        kind: 'text',
        text
      }
    ]);
  };

  // Append a decision card message (with decision + explanations)
  const pushDecisionCard = (
    decision: ApiDecision,
    explanations: string | undefined,
    aiExplanation: string | undefined,
    confidence: number,
    keyFactors: string[]
  ) => {
    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'bot',
        kind: 'decision',
        decision,
        explanations,
        aiExplanation,
        confidence,
        keyFactors
      }
    ]);
  };

  // Set a key-value pair to update a single field in the StudentInputPayload
  const setKV = <K extends keyof StudentInputPayload>(
    key: K,
    value: StudentInputPayload[K]
  ) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * Parse a yes / no style answer into boolean
   * Returns:
   *   true  → yes / y / true
   *   false → no / n / false
   *   null  → anything else (invalid answer)
   */
  const parseYesNo = (text: string): boolean | null => {
    const trimmed = text.trim().toLowerCase();
    if (['yes', 'y', 'true'].includes(trimmed)) return true;
    if (['no', 'n', 'false'].includes(trimmed)) return false;
    return null;
  };

   /**
   * Compute a confidence score based on system decision.
   * This is a simple heuristic for demo purposes.
   */
  const computeConfidence = (decision: ApiDecision): number => {
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

  /**
   * Build a list of key decision factors for the decision card UI.
   * Uses the student input plus the backend decision status.
   */
  const buildKeyFactors = (
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

    // Count “intent” ties to California
    const ties = [
      payload.hasCADriverLicense,
      payload.registeredToVoteInCA,
      payload.filesCATaxes
    ].filter(Boolean).length;

    factors.push(`Intent: ${ties} residency tie(s) found`);

    if (payload.hasCADriverLicense) factors.push('CA Driver License: Found');
    if (payload.registeredToVoteInCA) factors.push('CA Voter Registration: Found');
    if (payload.filesCATaxes) factors.push('CA Tax Filing: Found');
    if (payload.financiallyIndependent) factors.push('Financially independent');

    factors.push(`System decision: ${decision.status}`);

    return factors;
  };

  // Ask the next question based on the conversation step
  const askNextQuestion = (next: ConversationStep) => {
    setStep(next);

    switch (next) {
      case 'askMonths':
        pushBotText(
          'Great, thanks. How many months have you physically lived in California before the start of the term? (e.g., 14)'
        );
        break;
      case 'askCADriver':
        pushBotText('Do you have a valid California driver’s license or state ID? (yes / no)');
        break;
      case 'askVote':
        pushBotText('Are you registered to vote in California? (yes / no)');
        break;
      case 'askTax':
        pushBotText('Do you file California state income taxes as a resident? (yes / no)');
        break;
      case 'askIndependent':
        pushBotText('Are you financially independent from your parents/guardians? (yes / no)');
        break;
      case 'done':
        pushBotText('If you want to run another scenario, type "restart".');
        break;
      case 'evaluating':
      case 'welcome':
      default:
        break;
    }
  };

  // Call the backend /api/decide endpoint and show the resulting decision card
  const callBackendAndShowDecision = async () => {
    setStep('evaluating');
    setLoading(true);
    pushBotText('Got it. Let me evaluate your residency based on these answers...');

    try {
      const res = await fetch(DECIDE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        // Try to read error message from backend; fallback to HTTP status
        const data = await res.json().catch(() => ({}));
        const errorMsg =
          (data as { error?: string }).error || `Request failed with status ${res.status}`;
        pushBotText(errorMsg);
      } else {
        const data: ApiResponse = await res.json();

        // Small artificial delay so the UI feels like it is "thinking"
        await new Promise(resolve => setTimeout(resolve, 1000));

        const confidence = computeConfidence(data.decision);
        const keyFactors = buildKeyFactors(form, data.decision);
        pushDecisionCard(data.decision, data.explanations, data.aiExplanation, confidence, keyFactors);
      }
    } catch (err: unknown) {
      console.error(err);
      pushBotText('Server error. Please make sure the backend is running.');
    } finally {
      // After evaluation, mark conversation as done and allow restart
      setLoading(false);
      setStep('done');
      askNextQuestion('done');
    }
  };

  // Reset the entire conversation to initial state
  const resetConversation = () => {
    setForm(initialForm);
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: 'bot',
        kind: 'text',
        text: "Let's start a new scenario. I’ll ask a few questions to estimate residency."
      },
      {
        id: crypto.randomUUID(),
        sender: 'bot',
        kind: 'text',
        text: 'First, how old will you be when the term starts? (Just type a number, e.g., 19.)'
      }
    ]);
    setStep('askAge');
    setInput('');
  };

  // Process the user answer for the current step
  const processAnswerForStep = async (currentStep: ConversationStep, text: string) => {
    const trimmedLower = text.trim().toLowerCase();

    if (trimmedLower === 'restart') {
      resetConversation();
      return;
    }

    switch (currentStep) {
      case 'askAge': {
        const age = Number(text.trim());
        if (!Number.isFinite(age) || age <= 0) {
          pushBotText('Please enter a valid age as a number (e.g., 18).');
          return;
        }
        setKV('age', age);
        askNextQuestion('askMonths');
        return;
      }
      case 'askMonths': {
        const months = Number(text.trim());
        if (!Number.isFinite(months) || months < 0) {
          pushBotText('Please enter a non-negative number of months (e.g., 14).');
          return;
        }
        setKV('monthsInCA', months);
        askNextQuestion('askCADriver');
        return;
      }
      case 'askCADriver': {
        const yesNo = parseYesNo(text);
        if (yesNo === null) {
          pushBotText('Please answer with yes or no (e.g., "yes").');
          return;
        }
        setKV('hasCADriverLicense', yesNo);
        askNextQuestion('askVote');
        return;
      }
      case 'askVote': {
        const yesNo = parseYesNo(text);
        if (yesNo === null) {
          pushBotText('Please answer with yes or no.');
          return;
        }
        setKV('registeredToVoteInCA', yesNo);
        askNextQuestion('askTax');
        return;
      }
      case 'askTax': {
        const yesNo = parseYesNo(text);
        if (yesNo === null) {
          pushBotText('Please answer with yes or no.');
          return;
        }
        setKV('filesCATaxes', yesNo);
        askNextQuestion('askIndependent');
        return;
      }
      case 'askIndependent': {
        const yesNo = parseYesNo(text);
        if (yesNo === null) {
          pushBotText('Please answer with yes or no.');
          return;
        }
        setKV('financiallyIndependent', yesNo);
        await callBackendAndShowDecision();
        return;
      }
      case 'done': {
        pushBotText('Type "restart" if you would like to try another scenario.');
        return;
      }
      default:
        return;
    }
  };

  // Handle when the user clicks "Send" or presses Enter
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const currentStep = step;
    // push user message first
    pushUserText(trimmed);
    setInput('');
    await processAnswerForStep(currentStep, trimmed);
  };

  // Dynamic placeholder text based on loading state and conversation step
  const placeholder =
    loading
      ? 'Evaluating…'
      : step === 'done'
      ? 'Type "restart" to try another scenario'
      : 'Type your answer here…';

  return {
    messages,
    input,
    setInput,
    loading,
    step,
    placeholder,
    handleSend
  };
}
