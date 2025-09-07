'use client';

// components/chat/Message.tsx
import { UIMessage } from '@ai-sdk/react';
import { Card, CardBody } from '@heroui/react';
import { DocumentationToolPart, ComponentToolPart } from './ToolParts';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { User, Bot } from 'lucide-react';

interface MessageProps {
  message: UIMessage;
}

export function Message({ message }: MessageProps) {
  return (
    <Card className={`w-full ${
      message.role === 'user' ? 'bg-primary-50' : 'bg-secondary-50'
    }`}>
      <CardBody>
        <div className="flex items-center gap-2 font-semibold mb-2">
          {message.role === 'user' ? (
            <>
              <div className="bg-blue-500 text-white p-1.5 rounded-full">
                <User size={14} />
              </div>
              <span>You</span>
            </>
          ) : (
            <>
              <div className="bg-green-500 text-white p-1.5 rounded-full">
                <Bot size={14} />
              </div>
              <span>AI Assistant</span>
            </>
          )}
        </div>
        <div className="space-y-3">
          {message.parts && message.parts.map((part: any, index: number) => {
            switch (part.type) {
              case 'text': {
                if (!part.text) return null;
                
                // Process text to handle code blocks
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
          })}
        </div>
      </CardBody>
    </Card>
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
    <div key={key}>
      {segments.map((segment, i) => {
        if (segment.type === 'code') {
          return (
            <div key={i} className="my-3">
              <div className="bg-gray-800 text-gray-200 text-xs px-4 py-1 rounded-t">
                {segment.language || 'code'}
              </div>
              <SyntaxHighlighter
                language={segment.language || 'typescript'}
                style={dracula}
                customStyle={{ margin: 0, borderRadius: '0 0 0.25rem 0.25rem' }}
              >
                {segment.content}
              </SyntaxHighlighter>
            </div>
          );
        } else {
          return (
            <div key={i} className="whitespace-pre-wrap">
              {segment.content}
            </div>
          );
        }
      })}
    </div>
  );
}