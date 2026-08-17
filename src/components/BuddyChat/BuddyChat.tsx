"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import Button from '@/components/Button/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import './BuddyChat.css';

type Message = { id: string; role: 'user' | 'assistant'; text: string };

export default function BuddyChat() {
  const { firstName } = useCurrentUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask about strains, efficacy patterns, or stash alerts.',
    },
  ]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/internal/buddy/chat')
      .then((r) => r.json())
      .then((data: { prompts?: string[] }) => setPrompts(data.prompts ?? []))
      .catch(() => setPrompts(['What strain helps me sleep?', 'Compare strains for pain relief']));
  }, []);

  useEffect(() => {
    if (firstName === 'there') return;
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `Hey ${firstName} — ask about your stash, sessions, or efficacy patterns.`,
      },
    ]);
  }, [firstName]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/internal/buddy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as { reply?: string; prompts?: string[] };
      const reply: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.reply ?? 'I could not generate a reply right now. Try again in a moment.',
      };
      setMessages((m) => [...m, reply]);
      if (data.prompts?.length) setPrompts(data.prompts);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: 'Something went wrong reaching Buddy. Check your connection and try again.',
        },
      ]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      });
    }
  }

  return (
    <div className="buddy-chat glass-panel">
      <div className="buddy-chat-header">
        <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
        <span>PACS Assistant · scan &amp; stash coach</span>
      </div>

      <div className="buddy-chat-messages" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`buddy-chat-bubble buddy-chat-bubble-${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="buddy-chat-prompts">
        {prompts.map((p) => (
          <button key={p} type="button" className="buddy-chat-prompt" onClick={() => send(p)} disabled={sending}>
            {p}
          </button>
        ))}
      </div>

      <form
        className="buddy-chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your sessions…"
          aria-label="Message PACS Assistant"
          disabled={sending}
        />
        <Button type="submit" variant="primary" size="sm" icon={<Send size={14} strokeWidth={1.75} />} disabled={sending}>
          Send
        </Button>
      </form>
    </div>
  );
}
