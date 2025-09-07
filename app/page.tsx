// app/page.tsx
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-4xl">
        <ChatInterface />
      </div>
    </main>
  );
}