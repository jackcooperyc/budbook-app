"use client";

import React, { useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import Button from '@/components/Button/Button';
import { buddyPrompts, getBuddyReply } from '@/data/socialMock';
import './BuddyChat.css';

type Message = { id: string; role: 'user' | 'assistant'; text: string };

export default function BuddyChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hey Jordan — I’ve read your last 47 sessions. Ask about strains, efficacy patterns, or stash alerts.',
    },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    const reply: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: getBuddyReply(trimmed),
    };
    setMessages((m) => [...m, userMsg, reply]);
    setInput('');
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  }

  return (
    <div className="buddy-chat glass-panel">
      <div className="buddy-chat-header">
        <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
        <span>Buddy AI · wellness coach</span>
      </div>

      <div className="buddy-chat-messages" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`buddy-chat-bubble buddy-chat-bubble-${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="buddy-chat-prompts">
        {buddyPrompts.map((p) => (
          <button key={p} type="button" className="buddy-chat-prompt" onClick={() => send(p)}>
            {p}
          </button>
        ))}
      </div>

      <form
        className="buddy-chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your sessions…"
          aria-label="Message Buddy AI"
        />
        <Button type="submit" variant="primary" size="sm" icon={<Send size={14} strokeWidth={1.75} />}>
          Send
        </Button>
      </form>
    </div>
  );
}
