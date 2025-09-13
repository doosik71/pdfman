import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';

const ChatDisplay = memo(({ messages }) => {
  return (
    <div style={{ flexGrow: 1, border: '1px solid #eee', padding: '0.5rem', overflowY: 'auto', marginBottom: '0.5rem' }}>
      {messages.map((msg, index) => (
        <div key={index} style={{ marginBottom: '0.5rem', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
            <span style={{
              fontWeight: 'bold',
              color: msg.sender === 'user' ? '#0056b3' : '#28a745',
              marginRight: '0.5rem',
            }}>
              {msg.sender === 'user' ? 'You:' : 'AI:'}
            </span>
            <span style={{ display: 'inline-block', maxWidth: '80%', padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: msg.sender === 'user' ? '#e0f7fa' : '#f8f9fa' }}>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeMathjax]}>{msg.text}</ReactMarkdown>
            </span>
          </div>
      ))}
    </div>
  );
});

export default ChatDisplay;