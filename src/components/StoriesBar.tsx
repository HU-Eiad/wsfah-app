"use client";

import { useState, useEffect } from "react";
import StoryViewer from "@/components/StoryViewer";

interface Story {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  companyId: string;
  company: { id: string; name: string; logo: string | null };
}

interface CompanyGroup {
  company: { id: string; name: string; logo: string | null };
  stories: Story[];
}

export default function StoriesBar() {
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [activeStories, setActiveStories] = useState<Story[] | null>(null);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((data) => setGroups(data))
      .catch(() => {});
  }, []);

  if (groups.length === 0) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-4 py-3 no-scrollbar">
        {groups.map((group) => (
          <button
            key={group.company.id}
            onClick={() => setActiveStories(group.stories)}
            aria-label={`قصص ${group.company.name}`}
            className="flex flex-col items-center gap-1.5 shrink-0 w-16"
          >
            <div className="size-[60px] rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background-light">
              <div className="w-full h-full rounded-full bg-oat-milk overflow-hidden">
                {group.company.logo ? (
                  <img
                    src={group.company.logo}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center font-display text-xl text-forest dark:text-primary" aria-hidden>
                    {group.company.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span dir="auto" className="text-[11px] font-medium text-espresso/70 max-w-full truncate" aria-hidden>
              {group.company.name}
            </span>
          </button>
        ))}
      </div>

      {activeStories && (
        <StoryViewer
          stories={activeStories}
          onClose={() => setActiveStories(null)}
        />
      )}
    </>
  );
}
