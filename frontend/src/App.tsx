import React, { useEffect, useRef, useState } from 'react';
import botIcon from './assets/icons/robot.png';
import userIcon from './assets/icons/user.png';

type DecisionStatus = 'resident' | 'nonresident' | 'needs_review';

type ApiDecision = {
  status: DecisionStatus;
  reasons: string[];
};

type ApiResponse = {
  decision: ApiDecision;
  explanation?: string;
};

type MessageBase = {
  id: string;
  sender: 'user' | 'bot';
};

type TextMessage = MessageBase & {
  kind: 'text';
  text: string;
};

type DecisionMessage = MessageBase & {
  kind: 'decision';
  decision: ApiDecision;
  explanation?: string;
  confidence: number;
  keyFactors: string[];
};

type Message = TextMessage | DecisionMessage;

type StudentInputPayload = {
  age: number;
  monthsInCA: number;
  hasCADriverLicense: boolean;
  registeredToVoteInCA: boolean;
  filesCATaxes: boolean;
  financiallyIndependent: boolean;
};

const initialForm: StudentInputPayload = {
  age: 18,
  monthsInCA: 0,
  hasCADriverLicense: false,
  registeredToVoteInCA: false,
  filesCATaxes: false,
  financiallyIndependent: false
};

// 对话状态机的各个阶段
type ConversationStep =
  | 'welcome'
  | 'askAge'
  | 'askMonths'
  | 'askCADriver'
  | 'askVote'
  | 'askTax'
  | 'askIndependent'
  | 'evaluating'
  | 'done';

// 后端端点（通过 Vite 代理到 http://localhost:3000）
const DECIDE_ENDPOINT = '/api/decide?explain=true';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [form, setForm] = useState<StudentInputPayload>(initialForm);
  const [step, setStep] = useState<ConversationStep>('welcome');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // 初始欢迎 + 第一问
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

  // 自动滚动到底部
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const pushUserText = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'user',
        kind: 'text',
        text
      }
    ]);
  };

  const pushBotText = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'bot',
        kind: 'text',
        text
      }
    ]);
  };

  const pushDecisionCard = (res: ApiResponse, confidence: number, keyFactors: string[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'bot',
        kind: 'decision',
        decision: res.decision,
        explanation: res.explanation,
        confidence,
        keyFactors
      }
    ]);
  };

  const setKV = <K extends keyof StudentInputPayload>(
    key: K,
    value: StudentInputPayload[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const parseYesNo = (text: string): boolean | null => {
    const trimmed = text.trim().toLowerCase();
    if (['yes', 'y', 'true'].includes(trimmed)) return true;
    if (['no', 'n', 'false'].includes(trimmed)) return false;
    return null;
  };

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
      case 'evaluating':
        // 不问问题，这个状态用于调用后端
        break;
      case 'done':
        pushBotText(
          'If you want to run another scenario, type "restart".'
        );
        break;
      default:
        break;
    }
  };

  const callBackendAndShowDecision = async () => {
    setStep('evaluating');
    setLoading(true);
    pushBotText('Got it. Let me evaluate your residency based on these answers...');

    try {
      const res = await fetch(DECIDE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg =
          (data as { error?: string }).error || `Request failed with status ${res.status}`;
        pushBotText(errorMsg);
      } else {
        const data: ApiResponse = await res.json();

        // ⭐ ADD NATURAL DELAY HERE (one second)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const confidence = computeConfidence(data.decision);
        const keyFactors = buildKeyFactors(form, data.decision);
        pushDecisionCard(data, confidence, keyFactors);
      }
    } catch (err: unknown) {
      console.error(err);
      pushBotText('Server error. Please make sure the backend is running.');
    } finally {
      setLoading(false);
      setStep('done');
      askNextQuestion('done');
    }
  };

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

  const processAnswerForStep = async (currentStep: ConversationStep, text: string) => {
    // 全局命令：restart
    if (text.trim().toLowerCase() === 'restart') {
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
        // 在 done 状态下如果不是 restart，就简单提示一下
        pushBotText('Type "restart" if you would like to try another scenario.');
        return;
      }
      default:
        return;
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // 先推入用户消息
    pushUserText(trimmed);
    const currentStep = step;
    setInput('');
    await processAnswerForStep(currentStep, trimmed);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="app-root">
      <div className="chat-shell">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-title-block">
            <h1 className="chat-title">Residency Determination System — UC Riverside</h1>
            <p className="chat-subtitle">RDS Assistant · Demo</p>
          </div>
          <div className="chat-ucr-logo">UCR</div>
        </header>

        {/* Body */}
        <div className="chat-body">
          <div className="chat-window" ref={chatRef}>
            {messages.map((m) => {
              if (m.kind === 'text') {
                return (
                  <div
                    key={m.id}
                    className={`chat-row ${m.sender === 'user' ? 'chat-row-user' : 'chat-row-bot'}`}
                  >
                    {m.sender === 'bot' && (
                      <div className="avatar">
                        <img src={botIcon} className='avatar-img' alt='RDS Bot' />
                      </div>
                    )}

                    {m.sender === 'user' && (
                      <div className='avatar user-avatar'>
                        <img src={userIcon} className='avatar-img' alt="User" />
                      </div>
                    )}

                    <div
                      className={`bubble ${
                        m.sender === 'user' ? 'bubble-user' : 'bubble-bot'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              }

              // decision card message
              return (
                <div key={m.id} className="chat-row chat-row-bot">
                  <div className="avatar">
                    <img src={botIcon} className="avatar-img" alt="Bot" />
                  </div>
                  <div className="decision-card">
                    <p>
                      <strong>Decision:</strong>{' '}
                      <span className="decision-status">
                        {m.decision.status === 'resident'
                          ? 'California Resident'
                          : m.decision.status === 'nonresident'
                          ? 'Nonresident'
                          : 'Needs Review'}
                      </span>
                    </p>
                    <p>
                      <strong>Confidence:</strong> {m.confidence.toFixed(2)}
                    </p>
                    <div className="decision-factors">
                      <strong>Key Factors:</strong>
                      <ul>
                        {m.keyFactors.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    {m.explanation && (
                      <p className="decision-expl">{m.explanation}</p>
                    )}
                    <p className="decision-note">
                      This is a demo classification and not official residency determination.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input bar */}
          <div className="chat-input-bar">
            <input
              className="chat-input"
              placeholder={
                loading
                  ? 'Evaluating…'
                  : step === 'done'
                  ? 'Type "restart" to try another scenario'
                  : 'Type your answer here…'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              onClick={() => void handleSend()}
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="chat-footer">
          Demo only · Not official UCR residency guidance
        </footer>
      </div>
    </div>
  );
};

export default App;
