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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim() && !disabled) {
      e.preventDefault();
      onSend(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about API documentation or request components..."
        disabled={disabled}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-3 px-4 pr-12 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
        style={{
          fontSize: '15px',
          lineHeight: '1.5',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
      />
      <Button 
        type="submit" 
        disabled={disabled || !value.trim()}
        isLoading={disabled}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg p-2 transition-colors"
        style={{ width: '32px', height: '32px', minWidth: 'unset', padding: 0 }}
      >
        <Send size={16} className="mx-auto" />
      </Button>
    </form>
  );
}