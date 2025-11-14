import React, { useEffect, useRef, useState } from 'react';

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

// 这里我们假设前端通过 Vite 代理到 http://localhost:3000
// 所以只用相对路径 /api/decide 即可
const DECIDE_ENDPOINT = '/api/decide?explain=true';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [form, setForm] = useState<StudentInputPayload>(initialForm);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // 首次加载时，放入一条欢迎消息
  useEffect(() => {
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: 'bot',
        kind: 'text',
        text: "Hello! I'm the RDS Assistant. To begin, please provide your age, months in California, and residency ties (driver's license, voter registration, tax filing)."
      }
    ]);
  }, []);

  // 每次消息变更自动滚动到底部
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

  const setKV = <K extends keyof StudentInputPayload>(key: K, value: StudentInputPayload[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
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

  const buildKeyFactors = (payload: StudentInputPayload, decision: ApiDecision): string[] => {
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

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // 先把用户输入 push 到对话里
    pushUserText(trimmed);

    // 命令解析：age, months, caid, vote, tax, independent
    const lower = trimmed.toLowerCase();

    if (lower.startsWith('age:')) {
      const value = Number(trimmed.split(':')[1]?.trim() || 0);
      setKV('age', Number.isNaN(value) ? 0 : value);
      pushBotText(`Got it. Age set to ${value}.`);
    }

    if (lower.startsWith('months:')) {
      const value = Number(trimmed.split(':')[1]?.trim() || 0);
      setKV('monthsInCA', Number.isNaN(value) ? 0 : value);
      pushBotText(`Okay, months in California set to ${value}.`);
    }

    if (lower.startsWith('caid:')) {
      const yes = /yes|true/i.test(trimmed);
      setKV('hasCADriverLicense', yes);
      pushBotText(`CA Driver License: ${yes ? 'yes' : 'no'}.`);
    }

    if (lower.startsWith('vote:')) {
      const yes = /yes|true/i.test(trimmed);
      setKV('registeredToVoteInCA', yes);
      pushBotText(`Registered to vote in CA: ${yes ? 'yes' : 'no'}.`);
    }

    if (lower.startsWith('tax:')) {
      const yes = /yes|true/i.test(trimmed);
      setKV('filesCATaxes', yes);
      pushBotText(`Files CA taxes: ${yes ? 'yes' : 'no'}.`);
    }

    if (lower.startsWith('independent:')) {
      const yes = /yes|true/i.test(trimmed);
      setKV('financiallyIndependent', yes);
      pushBotText(`Financially independent: ${yes ? 'yes' : 'no'}.`);
    }

    // 提示用户可以提交
    if (!/^submit$/i.test(trimmed)) {
      pushBotText(
        "You can continue updating info (e.g., `age: 22`, `months: 14`, `caid: yes`, `vote: yes`, `tax: yes`, `independent: yes`) or type `submit` for a decision."
      );
    }

    // 提交：调用后端 /api/decide?explain=true
    if (/^submit$/i.test(trimmed)) {
      setLoading(true);
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

          const confidence = computeConfidence(data.decision);
          const keyFactors = buildKeyFactors(form, data.decision);

          pushDecisionCard(data, confidence, keyFactors);
        }
      } catch (err: unknown) {
        console.error(err);
        pushBotText('Server error. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    }

    setInput('');
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

        {/* Chat body */}
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
                        <div className="avatar-circle" />
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
                    <div className="avatar-circle" />
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

            {/* Hints card */}
            <div className="chat-row chat-row-bot">
              <div className="avatar">
                <div className="avatar-circle" />
              </div>
              <div className="hint-card">
                <strong>Hints</strong>
                <ul>
                  <li>
                    Set age:{' '}
                    <code>age: 22</code>
                  </li>
                  <li>
                    Set months in CA:{' '}
                    <code>months: 14</code>
                  </li>
                  <li>
                    Residency ties:{' '}
                    <code>caid: yes</code>, <code>vote: yes</code>, <code>tax: yes</code>,{' '}
                    <code>independent: yes</code>
                  </li>
                  <li>
                    When ready, type <code>submit</code> to get a decision.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="chat-input-bar">
            <input
              className="chat-input"
              placeholder={
                loading
                  ? 'Evaluating…'
                  : 'Type here… e.g., age: 22, months: 14, caid: yes, vote: yes, tax: yes'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              onClick={() => void handleSend()}
              disabled={loading}
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <footer className="chat-footer">
          Demo only · Not official UCR residency guidance
        </footer>
      </div>
    </div>
  );
};

export default App;
