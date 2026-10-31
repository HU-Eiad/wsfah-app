"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  creatorId: string;
  creator: { id: string; name: string | null; image: string | null };
  _count: { members: number };
  posts: PostData[];
}

interface PostData {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postBody, setPostBody] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchGroup = useCallback(async () => {
    const res = await fetch(`/api/groups/${id}`);
    if (res.ok) {
      const data: GroupDetail = await res.json();
      setGroup(data);
      setPosts(data.posts);
    }
    setLoading(false);
  }, [id]);

  const fetchPosts = useCallback(async () => {
    const res = await fetch(`/api/groups/${id}/posts`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
    }
  }, [id]);

  const checkMembership = useCallback(async () => {
    // Try to post an empty check - we'll determine membership from the group API
    // For now, we optimistically check via a member join attempt
    // A cleaner approach: just try joining and handle 409
    const res = await fetch(`/api/groups/${id}/members`, { method: "POST" });
    if (res.status === 409) {
      setIsMember(true);
    } else if (res.ok) {
      // Just joined
      setIsMember(true);
      fetchGroup();
    }
  }, [id, fetchGroup]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  async function handleJoin() {
    const res = await fetch(`/api/groups/${id}/members`, { method: "POST" });
    if (res.ok || res.status === 409) {
      setIsMember(true);
      fetchGroup();
    }
  }

  async function handleLeave() {
    const res = await fetch(`/api/groups/${id}/members`, { method: "DELETE" });
    if (res.ok) {
      setIsMember(false);
      fetchGroup();
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postBody.trim() || posting) return;
    setPosting(true);
    const res = await fetch(`/api/groups/${id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: postBody.trim() }),
    });
    if (res.ok) {
      setPostBody("");
      fetchPosts();
    } else if (res.status === 403) {
      // Not a member - attempt join
      await handleJoin();
    }
    setPosting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center" role="status" aria-label="جارٍ التحميل…">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background-light text-espresso flex items-center justify-center p-6">
        <div className="text-center">
          <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
          <p className="text-sm text-espresso/70">المجموعة غير موجودة.</p>
          <Link href="/groups" className="inline-block mt-4 bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors">
            كل المجموعات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light text-espresso">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/groups" aria-label="رجوع" className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 dir="auto" className="text-xl flex-1 truncate">{group.name}</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* Group info */}
        <section className="bg-surface rounded-2xl border border-espresso/10 p-4 mb-6">
          {group.description && (
            <p dir="auto" className="text-sm text-espresso/70 leading-relaxed">{group.description}</p>
          )}
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-espresso/60 ${group.description ? "mt-3" : ""}`}>
            <span className="flex items-center gap-1">
              <MaterialIcon icon="group" className="text-sm" />
              {group._count.members} {group._count.members === 1 ? "عضو" : "أعضاء"}
            </span>
            <span>
              أنشأها <span dir="auto">{group.creator.name || "غير معروف"}</span>
            </span>
          </div>
          <div className="mt-4">
            {isMember ? (
              <button
                onClick={handleLeave}
                className="border border-red-600/40 text-red-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                مغادرة المجموعة
              </button>
            ) : (
              <button
                onClick={handleJoin}
                className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                انضم للمجموعة
              </button>
            )}
          </div>
        </section>

        {/* Post composer */}
        {isMember && (
          <form onSubmit={handlePost} className="mb-6">
            <textarea
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              placeholder="اكتب شيئاً للمجموعة…"
              aria-label="منشور جديد"
              dir="auto"
              className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm leading-relaxed placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!postBody.trim() || posting}
                className="mt-2 bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {posting ? "جارٍ النشر…" : "نشر"}
              </button>
            </div>
          </form>
        )}

        {/* Posts */}
        <h2 className="text-xl mb-4">المنشورات</h2>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
              <p className="text-sm text-espresso/70">
                لا توجد منشورات بعد. كن أول من يشارك شيئاً!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="bg-surface rounded-2xl border border-espresso/10 p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  {post.author.image ? (
                    <img
                      src={post.author.image}
                      alt=""
                      className="size-10 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-oat-milk flex items-center justify-center text-forest dark:text-primary font-display text-base" aria-hidden>
                      {post.author.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p dir="auto" className="text-sm font-bold truncate">
                      {post.author.name || "غير معروف"}
                    </p>
                    <p className="text-xs text-espresso/60">
                      {new Date(post.createdAt).toLocaleDateString("ar")}
                    </p>
                  </div>
                </div>
                <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap">
                  {post.body}
                </p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="mt-3 rounded-[20px] max-h-96 w-full object-cover"
                  />
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
