'use client';

import { useChat, UIMessage } from '@ai-sdk/react';
import { ChatInput } from './ChatInput';
import { Message } from './Message';

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-4">
      <div className="space-y-3">
        {messages.map((msg: UIMessage) => (
          <Message key={msg.id} message={msg} />
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <ChatInput
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question..."
        />
      </form>
    </div>
  );
}