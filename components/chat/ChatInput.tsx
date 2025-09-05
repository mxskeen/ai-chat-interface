// components/chat/ChatInput.tsx
import { Input } from '@heroui/react';
import { UIMessage } from '@ai-sdk/react';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  onSend?: (value: string) => void; // onSend is optional
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  placeholder,
  onSend,
  disabled,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSend) {
      onSend(value);
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder || 'Type a message...'}
      className="w-full p-2 border rounded"
      disabled={disabled}
    />
  );
}