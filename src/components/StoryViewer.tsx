"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import MaterialIcon from "@/components/MaterialIcon";
import SafeImage from "@/components/SafeImage";

interface Story {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  company: { id: string; name: string; logo: string | null };
}

interface StoryViewerProps {
  stories: Story[];
  onClose: () => void;
}

export default function StoryViewer({ stories, onClose }: StoryViewerProps) {
  const t = useTranslations("storyViewer");
  const tc = useTranslations("common");
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewedRef = useRef<Set<string>>(new Set());

  const current = stories[index];

  const recordView = useCallback((storyId: string) => {
    if (viewedRef.current.has(storyId)) return;
    viewedRef.current.add(storyId);
    fetch(`/api/stories/${storyId}/view`, { method: "POST" }).catch(() => {});
  }, []);

  const goNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [index, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setProgress(0);
    }
  }, [index]);

  // Auto-advance timer (5 seconds)
  useEffect(() => {
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);

    const interval = 50; // 50ms ticks
    const totalTicks = 5000 / interval; // 100 ticks for 5 seconds
    let tick = 0;

    timerRef.current = setInterval(() => {
      tick++;
      setProgress((tick / totalTicks) * 100);
      if (tick >= totalTicks) {
        goNext();
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, goNext]);

  // Record view on story change
  useEffect(() => {
    if (current) recordView(current.id);
  }, [current, recordView]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      goPrev();
    } else {
      goNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-paper flex flex-col" role="dialog" aria-modal="true" aria-label={t("dialogLabel")}>
      {/* Progress bars */}
      <div className="flex gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        {stories.map((s, i) => (
          <div
            key={s.id}
            className="h-[3px] flex-1 rounded-full bg-paper/30 overflow-hidden"
          >
            <div
              className="h-full bg-paper rounded-full transition-all"
              style={{
                width:
                  i < index
                    ? "100%"
                    : i === index
                    ? `${progress}%`
                    : "0%",
                transition: i === index ? "width 50ms linear" : "none",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          {current.company.logo ? (
            <SafeImage
              src={current.company.logo}
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-full object-cover ring-1 ring-paper/20"
            />
          ) : (
            <div className="size-9 rounded-full bg-paper/15 flex items-center justify-center font-display text-base text-paper" aria-hidden>
              {current.company.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span dir="auto" className="text-paper text-sm font-semibold">
            {current.company.name}
          </span>
        </div>
        <button
          onClick={onClose}
          className="size-10 rounded-full flex items-center justify-center text-paper hover:bg-paper/15 transition-colors"
          aria-label={tc("close")}
        >
          <MaterialIcon icon="close" />
        </button>
      </div>

      {/* Media area */}
      <div className="flex-1 relative cursor-pointer" onClick={handleTap}>
        {current.mediaType === "video" ? (
          <video
            key={current.id}
            src={current.mediaUrl}
            className="absolute inset-0 w-full h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <SafeImage
            key={current.id}
            src={current.mediaUrl}
            alt={current.caption || t("storyAlt")}
            fill
            sizes="100vw"
            className="object-contain"
          />
        )}

        {/* Caption */}
        {current.caption && (
          <div className="absolute bottom-0 inset-x-0 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/75 to-transparent">
            <p dir="auto" className="text-paper text-sm leading-relaxed">{current.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
