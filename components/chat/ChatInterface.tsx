'use client';

import { useState } from 'react';
import { ChatInput } from './ChatInput';
import { Message } from './Message';
import { UIMessage } from '@ai-sdk/react';
import { Card } from '@heroui/react';

function createMessage(role: 'user' | 'assistant', text: string): UIMessage {
  return {
    id: Math.random().toString(36).slice(2),
    role,
    parts: [{ type: 'text', text }],
  } as UIMessage;
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text: string) => {
    setIsLoading(true);
    const userMessage = createMessage('user', text);
    setMessages((prev) => [...prev, userMessage]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage = createMessage('assistant', '');
      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const data = JSON.parse(line.slice(2));
              if (data.type === 'text-delta' && data.textDelta) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.parts[0] = {
                      type: 'text',
                      text: (lastMessage.parts[0] as any).text + data.textDelta
                    };
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = createMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
    
    setInput('');
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-4">
      <Card className="p-4 mb-4 bg-primary-50">
        <h1 className="text-2xl font-bold mb-2">AI Assistant</h1>
        <p className="text-sm text-gray-700">
          This AI assistant can help you understand API documentation and generate React components.
          Try asking about API integration or generating components!
        </p>
      </Card>
      
      <div className="space-y-3">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        
        {isLoading && messages.length === 0 && (
          <Card className="p-4 bg-gray-50 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">Initializing chat...</p>
          </Card>
        )}
      </div>
      
      <ChatInput 
        value={input} 
        onChange={setInput} 
        onSend={handleSend} 
        disabled={isLoading} 
      />
    </div>
  );
}