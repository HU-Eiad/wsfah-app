"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  updatedAt: string;
  otherUser: { id: string; name: string | null; image: string | null } | null;
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    sender: { id: string; name: string | null };
  } | null;
  lastReadAt: string | null;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/messages/conversations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setConversations(data);
      })
      .finally(() => setLoading(false));
  }, []);

  function isUnread(c: Conversation) {
    if (!c.lastMessage || !c.lastReadAt) return !!c.lastMessage;
    return new Date(c.lastMessage.createdAt) > new Date(c.lastReadAt);
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "الآن";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} د`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} س`;
    return d.toLocaleDateString("ar-u-nu-latn");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center" role="status" aria-label="جارٍ التحميل…">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light text-espresso">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <h1 className="text-2xl flex-1">الرسائل</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
            <p className="text-sm text-espresso/70">لا توجد محادثات بعد.</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-espresso/10 divide-y divide-espresso/10 overflow-hidden">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/messages/${c.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-oat-milk transition-colors text-start"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {c.otherUser?.image ? (
                    <img
                      src={c.otherUser.image}
                      alt=""
                      className="size-12 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
                    />
                  ) : (
                    <div className="size-12 rounded-full bg-oat-milk flex items-center justify-center text-forest dark:text-primary font-display text-xl" aria-hidden>
                      {c.otherUser?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  {isUnread(c) && (
                    <span className="absolute top-0 end-0 size-3 rounded-full bg-crema border-2 border-surface" aria-label="غير مقروءة" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      dir="auto"
                      className={`truncate ${
                        isUnread(c)
                          ? "font-bold text-espresso"
                          : "font-semibold text-espresso/80"
                      }`}
                    >
                      {c.otherUser?.name || "غير معروف"}
                    </span>
                    {c.lastMessage && (
                      <span className="text-xs text-espresso/60 shrink-0">
                        {formatTime(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {c.lastMessage && (
                    <p
                      dir="auto"
                      className={`text-sm truncate mt-0.5 ${
                        isUnread(c)
                          ? "text-espresso font-semibold"
                          : "text-espresso/60"
                      }`}
                    >
                      {c.lastMessage.body}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
