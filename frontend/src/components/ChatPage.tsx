import React from 'react';
import { useChatStateMachine } from '../hooks/useChatStateMachine';
import { MessageList } from './MessageList';
import { ChatInputBar } from './ChatInputBar';

export const ChatPage: React.FC = () => {
  const {
    messages,
    input,
    setInput,
    loading,
    placeholder,
    handleSend
  } = useChatStateMachine();

  return (
    <div className="app-root">
      <div className="chat-shell">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-title-block">
            <h1 className="chat-title">
              Residency Determination System Chatbot
            </h1>
            <p className="chat-subtitle">RDS Assistant · Demo</p>
          </div>
          <div className="chat-ucr-logo">UC</div>
        </header>

        {/* Body */}
        <div className="chat-body">
          <MessageList messages={messages} />
          <ChatInputBar
            input={input}
            setInput={setInput}
            loading={loading}
            placeholder={placeholder}
            onSend={handleSend}
          />
        </div>

        {/* Footer */}
        <footer className="chat-footer">
          Demo only · Not official UC residency guidance
        </footer>
      </div>
    </div>
  );
};
