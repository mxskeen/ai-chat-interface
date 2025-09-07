'use client';

// components/chat/Message.tsx
// Implementation using ai-sdk.dev for message formatting and tool part rendering
import { UIMessage } from '@ai-sdk/react'; // ai-sdk.dev message structure
import { Card, CardBody } from '@heroui/react';
import { DocumentationToolPart, ComponentToolPart } from './ToolParts';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { User, Bot } from 'lucide-react';

interface MessageProps {
  message: UIMessage;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-[var(--accent)] text-white' 
              : 'bg-[var(--muted)]/10 text-[var(--muted)]'
          }`}>
            {isUser ? (
              <User size={16} />
            ) : (
              <Bot size={16} />
            )}
          </div>
        </div>
        
        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block ${
            isUser 
              ? 'bg-[var(--accent)] text-white' 
              : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]'
          } rounded-2xl px-4 py-3`}>
            <div className="space-y-3">
              {/* Handle both UIMessage format and regular message format */}
              {message.parts ? (
                // UIMessage format with parts
                message.parts.map((part: any, index: number) => {
                  switch (part.type) {
                    case 'text': {
                      if (!part.text) return null;
                      return parseAndRenderContent(part.text, index);
                    }
                    case 'tool-browseDocumentation':
                      return (
                        <DocumentationToolPart 
                          key={index} 
                          part={part} 
                        />
                      );
                    case 'tool-generateComponent':
                      return (
                        <ComponentToolPart 
                          key={index} 
                          part={part} 
                        />
                      );
                    default:
                      return null;
                  }
                })
              ) : (
                // Regular message format with content
                (message as any).content && parseAndRenderContent((message as any).content)
              )}
            </div>
          </div>
          
          {/* Message Time - Optional */}
          <div className={`text-xs text-[var(--muted)] mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {isUser ? 'You' : 'AI Assistant'}
          </div>
        </div>
      </div>
    </div>
  );
}

type TextSegment = { type: 'text'; content: string } | { type: 'code'; content: string; language?: string };

function parseCodeBlocks(text: string): TextSegment[] {
  const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)```/g;
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Add code block
    segments.push({
      type: 'code',
      language: match[1] || 'typescript',
      content: match[2]
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return segments;
}

function parseAndRenderContent(content: string, key: number = 0) {
  if (!content) return null;
  const segments = parseCodeBlocks(content);
  
  return (
    <div key={key} className="text-left">
      {segments.map((segment, i) => {
        if (segment.type === 'code') {
          return (
            <div key={i} className="my-4 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)]">
              <div className="flex items-center justify-between bg-[var(--background)] border-b border-[var(--border)] px-4 py-2">
                <span className="text-xs font-medium text-[var(--muted)]">
                  {segment.language || 'code'}
                </span>
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--error)]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--warning)]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)]"></div>
                </div>
              </div>
              <SyntaxHighlighter
                language={segment.language || 'typescript'}
                style={dracula}
                customStyle={{ 
                  margin: 0, 
                  borderRadius: 0,
                  fontSize: '13px',
                  padding: '12px',
                  background: 'var(--background)'
                }}
              >
                {segment.content}
              </SyntaxHighlighter>
            </div>
          );
        } else {
          return (
            <div key={i} className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {segment.content}
            </div>
          );
        }
      })}
    </div>
  );
}