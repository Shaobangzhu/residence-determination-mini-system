import { useEffect, useState } from 'react';

import type { ApiDecision } from '../types/api-types';
import type { ConversationStep } from '../types/conversation-step';
import type { Message } from '../types/message-types';
import { type StudentInputPayload, initialForm } from '../types/student-input-payload';

import { decideResidency } from '../api/decisionApi';
import { computeConfidence, buildKeyFactors } from '../utils/decisionHelpers';

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
        text: "Hello! I'm the RDS Assistant for University of California. I'll ask a few questions to estimate residency for tuition purposes."
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
        pushBotText('Do you have a valid California driver\'s license or state ID? (yes / no)');
        break;
      case 'askVote':
        pushBotText('Are you registered to vote in California? (yes / no)');
        break;
      case 'askTax':
        pushBotText('Do you file California state income taxes as a resident? (yes / no)');
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
  const callBackendAndShowDecision = async (payload: StudentInputPayload) => {
    setStep('evaluating');
    setLoading(true);
    pushBotText('Got it. Let me evaluate your residency based on these answers...');

    try {
      const data = await decideResidency(payload);

      const confidence = computeConfidence(data.decision);
      const keyFactors = buildKeyFactors(payload, data.decision);
      pushDecisionCard(data.decision, data.explanations, data.aiExplanation, confidence, keyFactors);
      
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
        //Build the latest snapshot of the form including the LAST answer
        const nextForm: StudentInputPayload = {
          ...form,
          filesCATaxes: yesNo
        };
        // Update form state
        setForm(nextForm);

        //Use the freshest form to call the backend
        await callBackendAndShowDecision(nextForm);
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
