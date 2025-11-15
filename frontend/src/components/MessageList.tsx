import React, { useEffect, useRef } from 'react';
import type { Message } from '../types/message-types';
import { DecisionCard } from './DecisionCard';
// @ts-expect-error: PNG module declarations are not present in this project
import botIcon from '../assets/icons/robot.png';
// @ts-expect-error: PNG module declarations are not present in this project
import userIcon from '../assets/icons/user.png';

type Props = {
  messages: Message[];
};

export const MessageList: React.FC<Props> = ({ messages }) => {
  const chatRef = useRef<HTMLDivElement | null>(null);

  // auto scroll
  useEffect(() => {
    if (chatRef.current && typeof chatRef.current.scrollTo === 'function') {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <div className="chat-window" ref={chatRef}>
      {messages.map(m => {
        if (m.kind === 'text') {
          return (
            <div
              key={m.id}
              className={`chat-row ${m.sender === 'user' ? 'chat-row-user' : 'chat-row-bot'}`}
            >
              {m.sender === 'bot' && (
                <div className="avatar">
                  <img src={botIcon} className="avatar-img" alt="RDS Bot" />
                </div>
              )}

              {m.sender === 'user' && (
                <div className="avatar user-avatar">
                  <img src={userIcon} className="avatar-img" alt="User" />
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

        // decision message
        return (
          <div key={m.id} className="chat-row chat-row-bot">
            <div className="avatar">
              <img src={botIcon} className="avatar-img" alt="RDS Bot" />
            </div>
            <DecisionCard message={m} />
          </div>
        );
      })}
    </div>
  );
};
