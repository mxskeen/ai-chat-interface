'use client';

import { useState } from 'react';
import { ChatInput } from './ChatInput';
import { Message } from './Message';
import { UIMessage } from '@ai-sdk/react';

function createMessage(role: 'user' | 'assistant', text: string): UIMessage {
  return {
    id: Math.random().toString(36).slice(2),
    role,
    parts: [{ type: 'text', text }],
  } as UIMessage;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (text: string) => {
    setLoading(true);
    const userMessage = createMessage('user', text);
    setMessages((prev) => [...prev, userMessage]);
    // TODO: Call API and get assistant response
    // For now, just echo
    setTimeout(() => {
      setMessages((prev) => [...prev, createMessage('assistant', 'Echo: ' + text)]);
      setLoading(false);
    }, 1000);
    setInput('');
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-4">
      <div className="space-y-3">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
      </div>
      <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={loading} />
    </div>
  );
}