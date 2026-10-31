"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import MaterialIcon from "@/components/MaterialIcon";
import { useTranslations, useLocale } from "next-intl";
import { intlLocale } from "@/i18n/format";

interface MessageData {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
}

interface ConversationInfo {
  messages: MessageData[];
  nextCursor: string | null;
}

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("messagesDetail");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [otherUser, setOtherUser] = useState<{ name: string | null } | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/messages/conversations/${id}`);
    if (!res.ok) return;
    const data: ConversationInfo = await res.json();
    setMessages(data.messages.slice().reverse());

    // Determine other user from messages
    if (data.messages.length > 0 && currentUserId) {
      const other = data.messages.find((m) => m.sender.id !== currentUserId);
      if (other) setOtherUser({ name: other.sender.name });
    }
  }, [id, currentUserId]);

  // Get current user
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (s?.user?.id) setCurrentUserId(s.user.id);
      });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [currentUserId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: input.trim() }),
      });

      if (res.ok) {
        const msg: MessageData = await res.json();
        setMessages((prev) => [...prev, msg]);
        setInput("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background-light text-espresso flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <button
          onClick={() => router.push("/messages")}
          aria-label={tc("back")}
          className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk"
        >
          <MaterialIcon icon="arrow_forward" />
        </button>
        <h1 dir="auto" className="text-xl flex-1 truncate">
          {otherUser?.name || t("conversation")}
        </h1>
      </header>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((msg) => {
          const isOwn = msg.sender.id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isOwn
                    ? "bg-primary text-on-primary rounded-ee-md"
                    : "bg-surface border border-espresso/10 text-espresso rounded-es-md"
                }`}
              >
                {!isOwn && (
                  <p dir="auto" className="text-xs font-semibold text-primary mb-1">
                    {msg.sender.name}
                  </p>
                )}
                <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                <p
                  className={`text-[11px] mt-1 ${
                    isOwn ? "text-on-primary/70" : "text-espresso/60"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString(intlLocale(locale), {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="sticky bottom-0 bg-background-light/95 backdrop-blur-md border-t border-espresso/10 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          aria-label={t("inputLabel")}
          dir="auto"
          className="flex-1 min-w-0 bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="bg-primary text-on-primary rounded-xl px-5 py-3 text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}
