import React from 'react';

type Props = {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  placeholder: string;
  onSend: () => Promise<void> | void;
};

export const ChatInputBar: React.FC<Props> = ({
  input,
  setInput,
  loading,
  placeholder,
  onSend
}) => {
  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  };

  return (
    <div className="chat-input-bar">
      <input
        className="chat-input"
        placeholder={placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <button
        className="chat-send-btn"
        onClick={() => void onSend()}
        disabled={loading || !input.trim()}
      >
        {loading ? '...' : 'Send'}
      </button>
    </div>
  );
};
