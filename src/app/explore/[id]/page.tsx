"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";
import FollowButton from "@/components/FollowButton";
import CommentSection from "@/components/CommentSection";
import BottomNav from "@/components/BottomNav";
import { useTranslations, useLocale } from "next-intl";
import { intlLocale } from "@/i18n/format";

interface Post {
  id: string;
  imageUrl: string;
  mediaType: string;
  caption: string | null;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  company: { id: string; name: string; logo: string | null } | null;
  _count: { galleryLikes: number };
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("exploreDetail");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/gallery/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPost(data);
        setLikeCount(data._count?.galleryLikes ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Fetch current user
  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => { if (r.ok) return r.json(); throw new Error(); })
      .then((data) => setCurrentUserId(data.id))
      .catch(() => {});
  }, []);

  // Fetch like status
  useEffect(() => {
    fetch(`/api/gallery/${id}/like`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.liked === "boolean") setLiked(data.liked);
      })
      .catch(() => {});
  }, [id]);

  const toggleLike = useCallback(async () => {
    if (likeBusy) return;
    setLikeBusy(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    try {
      const res = await fetch(`/api/gallery/${id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
      } else {
        setLiked(wasLiked);
        setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
    } finally {
      setLikeBusy(false);
    }
  }, [id, liked, likeBusy]);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/explore/${id}`;
    if (navigator.share) {
      navigator.share({ title: post?.caption || t("shareTitle"), url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => alert(t("linkCopied"))).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-background-light text-espresso min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
          <p className="text-sm text-espresso/70">{t("notFound")}</p>
          <Link href="/explore" className="inline-block mt-4 bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors">{t("backToExplore")}</Link>
        </div>
      </div>
    );
  }

  const displayName = post.company?.name || post.author.name || tc("unknownUser");
  const displayAvatar = post.company?.logo || post.author.image || "/brand/banners/avatar-placeholder.svg";
  const profileLink = post.company ? `/brand/${post.company.id}` : "#";
  const followUserId = post.author.id;
  const isOwnPost = currentUserId === post.author.id;

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/explore" aria-label={tc("back")} className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">{t("title")}</h1>
        <button onClick={handleShare} aria-label={tc("share")} className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="share" />
        </button>
      </header>

      <main className="flex-1 pb-28">
        {/* Author Header */}
        <div className="flex items-center gap-3 p-4">
          <Link href={profileLink} className="shrink-0">
            <img
              src={displayAvatar}
              alt={displayName}
              className="size-11 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={profileLink}>
              <p className="font-bold text-sm truncate" dir="auto">{displayName}</p>
              {post.company && (
                <div className="flex items-center gap-1">
                  <BrandIcon name="verified" className="text-primary text-xs" />
                  <span className="text-xs text-primary font-semibold">{tc("badges.brand")}</span>
                </div>
              )}
            </Link>
          </div>
          {!isOwnPost && (
            <FollowButton userId={followUserId} className="text-sm px-4 py-2" />
          )}
        </div>

        {/* Media */}
        <div className="bg-black">
          {post.mediaType === "video" ? (
            <video
              src={post.imageUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[70vh] object-contain mx-auto"
            />
          ) : (
            <img src={post.imageUrl} alt={post.caption || ""} className="w-full max-h-[70vh] object-contain mx-auto" />
          )}
        </div>

        {/* Engagement Bar */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-espresso/10">
          <button
            onClick={toggleLike}
            disabled={likeBusy}
            aria-label={liked ? t("unlike") : t("like")}
            className="flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
          >
            <MaterialIcon
              icon="favorite"
              filled={liked}
              className={`text-2xl ${liked ? "text-red-500" : "text-espresso/60"}`}
            />
            <span className="text-sm font-bold tabular-nums">{likeCount}</span>
          </button>

          <button onClick={handleShare} aria-label={tc("share")} className="flex items-center gap-1.5 active:scale-95 transition-transform">
            <MaterialIcon icon="send" className="text-2xl text-espresso/60" />
          </button>

          <div className="ms-auto">
            <span className="text-xs text-espresso/60">
              {new Date(post.createdAt).toLocaleDateString(intlLocale(locale))}
            </span>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 py-3">
            <p className="text-sm leading-relaxed" dir="auto">
              <span dir="auto" className="font-bold me-1">{displayName}</span>
              {post.caption}
            </p>
          </div>
        )}

        {/* Comments Section */}
        <div className="px-4 py-4">
          <CommentSection postId={id} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
