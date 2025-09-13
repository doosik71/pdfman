import React, { useState, memo } from 'react';

const ChatInput = memo(({ onSendMessage, isChatting }) => {
  const [currentMessage, setCurrentMessage] = useState('');

  const handleSend = () => {
    if (currentMessage.trim()) {
      onSendMessage(currentMessage);
      setCurrentMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', marginTop: '0.5rem' }}>
      <input
        type="text"
        value={currentMessage}
        onChange={(e) => setCurrentMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask a question about the document..."
        style={{ flexGrow: 1, marginRight: '0.5rem', padding: '0.5rem' }}
        disabled={isChatting}
      />
      <button onClick={handleSend} disabled={isChatting || !currentMessage.trim()}>
        {isChatting ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
});

export default ChatInput;