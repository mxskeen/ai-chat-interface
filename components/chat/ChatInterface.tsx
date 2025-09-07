'use client';

// Using ai-sdk.dev for message formatting and UI components
import { useState } from 'react';
import { ChatInput } from './ChatInput';
import { Message } from './Message';
import { UIMessage } from '@ai-sdk/react'; // ai-sdk.dev message format
// import { Card } from '@heroui/react';

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

      const assistantMessage = createMessage('assistant', '');
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
                      text: (lastMessage.parts[0] as { type: string; text: string }).text + data.textDelta
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
                    } as { type: string; state: string; output?: unknown });
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
                    const toolPartIndex = lastMessage.parts.findIndex((part: { type: string; state: string }) => 
                      part.type === data.type && part.state === 'input-streaming'
                    );
                    if (toolPartIndex !== -1) {
                      lastMessage.parts[toolPartIndex] = {
                        type: data.type,
                        state: data.state,
                        output: data.output,
                      } as { type: string; state: string; output?: unknown };
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
                    const toolPartIndex = lastMessage.parts.findIndex((part: { type: string; state: string }) => 
                      part.type === toolType && part.state === 'input-streaming'
                    );
                    if (toolPartIndex !== -1) {
                      lastMessage.parts[toolPartIndex] = {
                        type: toolType,
                        state: 'output-error',
                        errorText: data.errorText,
                      } as { type: string; state: string; output?: unknown };
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
            (newMessages[newMessages.length - 1].parts[0] as { type: string; state: string; output?: unknown }).text === '') {
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
                AI Assistant
              </h1>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                API documentation analysis and React component generation
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[var(--success)] rounded-full"></div>
              <span className="text-xs text-[var(--muted)] font-medium">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="mx-6 mt-4">
          <div className="bg-[var(--error)]/5 border border-[var(--error)]/20 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-[var(--error)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[var(--foreground)]">Connection Error</h3>
                <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">{error}</p>
                <p className="text-xs text-[var(--muted)] mt-2 opacity-75">
                  Ensure your API keys are configured in the .env.local file
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                Ready to assist you
              </h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed max-w-md mx-auto">
                Ask me to browse API documentation, generate React components, or explain integration patterns. 
                Try mentioning BillingSDK or DodoPayments for examples.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button 
                  onClick={() => handleSend("Browse the documentation at billingsdk.com")}
                  className="px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/50 transition-colors"
                >
                  Browse BillingSDK docs
                </button>
                <button 
                  onClick={() => handleSend("Generate a pricing card component")}
                  className="px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/50 transition-colors"
                >
                  Generate pricing component
                </button>
              </div>
            </div>
          )}
          
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
          
          {isLoading && (
            <div className="flex items-center space-x-3 py-4">
              <div className="w-8 h-8 bg-[var(--accent)]/10 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin"></div>
              </div>
              <div className="flex-1">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-sm text-[var(--muted)]">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
        <div className="px-6 py-4">
          <ChatInput 
            value={input} 
            onChange={setInput} 
            onSend={handleSend} 
            disabled={isLoading} 
          />
        </div>
      </div>
    </div>
  );
}