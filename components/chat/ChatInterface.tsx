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
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text: string) => {
    setError(null);
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
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
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
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
              } else if (data.type === 'tool-call-start') {
                // Add a loading indicator for the tool call
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.parts.push({
                      type: data.toolName === 'browseDocumentation' ? 'tool-browseDocumentation' : 'tool-generateComponent',
                      state: 'input-streaming',
                    } as any);
                  }
                  return newMessages;
                });
              } else if (data.type === 'tool-browseDocumentation' || data.type === 'tool-generateComponent') {
                // Update the tool call result
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    // Find and update the tool part
                    const toolPartIndex = lastMessage.parts.findIndex((part: any) => 
                      part.type === data.type && part.state === 'input-streaming'
                    );
                    if (toolPartIndex !== -1) {
                      lastMessage.parts[toolPartIndex] = {
                        type: data.type,
                        state: data.state,
                        output: data.output,
                      } as any;
                    }
                  }
                  return newMessages;
                });
              } else if (data.type === 'tool-error') {
                // Handle tool errors
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    const toolType = data.toolName === 'browseDocumentation' ? 'tool-browseDocumentation' : 'tool-generateComponent';
                    const toolPartIndex = lastMessage.parts.findIndex((part: any) => 
                      part.type === toolType && part.state === 'input-streaming'
                    );
                    if (toolPartIndex !== -1) {
                      lastMessage.parts[toolPartIndex] = {
                        type: toolType,
                        state: 'output-error',
                        errorText: data.errorText,
                      } as any;
                    }
                  }
                  return newMessages;
                });
              } else if (data.type === 'error') {
                throw new Error(data.errorText);
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
      // Remove the empty assistant message if there was an error
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant' && 
            (newMessages[newMessages.length - 1].parts[0] as any).text === '') {
          newMessages.pop();
        }
        return newMessages;
      });
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
      
      {error && (
        <Card className="p-4 mb-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <div className="text-red-600">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs text-red-500 mt-1">
                Make sure your API keys are configured in .env.local file
              </p>
            </div>
          </div>
        </Card>
      )}
      
      <div className="space-y-3">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        
        {isLoading && (
          <Card className="p-4 bg-blue-50 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-2 text-sm text-blue-600">AI is thinking...</p>
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