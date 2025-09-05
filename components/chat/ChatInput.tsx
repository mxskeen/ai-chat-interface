// components/chat/ChatInput.tsx
import { Button, Input } from '@heroui/react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask about API documentation or request components..."
        disabled={disabled}
        className="flex-1"
        size="sm"
      />
      <Button 
        type="submit" 
        disabled={disabled || !value.trim()}
        isLoading={disabled}
        size="sm"
        color="primary"
        startContent={<Send size={16} />}
      >
        Send
      </Button>
    </form>
  );
}