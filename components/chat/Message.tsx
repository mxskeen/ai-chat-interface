'use client';

// components/chat/Message.tsx
import { UIMessage } from '@ai-sdk/react';
import { Card, CardBody } from '@heroui/react';
import { DocumentationToolPart, ComponentToolPart } from './ToolParts';

interface MessageProps {
  message: UIMessage;
}

export function Message({ message }: MessageProps) {
  return (
    <Card className={`w-full ${
      message.role === 'user' ? 'bg-primary-50' : 'bg-secondary-50'
    }`}>
      <CardBody>
        <div className="font-semibold mb-2">
          {message.role === 'user' ? 'You' : 'AI Assistant'}
        </div>
        <div className="space-y-3">
          {message.parts.map((part: UIMessage['parts'][number], index: number) => {
            switch (part.type) {
              case 'text':
                return (
                  <div key={index} className="whitespace-pre-wrap">
                    {part.text}
                  </div>
                );
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