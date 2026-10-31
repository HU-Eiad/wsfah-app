"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
  replies: Comment[];
}

interface CommentSectionProps {
  recipeId?: string;
  postId?: string;
}

export default function CommentSection({ recipeId, postId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [newComment, setNewComment] = useState("");

  const endpoint = recipeId ? `/api/recipes/${recipeId}/comments` : `/api/gallery/${postId}/comments`;

  const fetchComments = async (cursor?: string) => {
    try {
      setLoading(true);
      const url = cursor ? `${endpoint}?cursor=${cursor}` : endpoint;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      if (cursor) {
        setComments((prev) => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [recipeId, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user?.id) return;

    try {
      setSubmitting(true);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment, parentId: replyingTo || null }),
      });
      if (!res.ok) throw new Error("Failed to create comment");
      const newCommentData = await res.json();
      if (replyingTo) {
        // Add reply to parent comment
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyingTo
              ? { ...c, replies: [...c.replies, newCommentData] }
              : c
          )
        );
      } else {
        // Add new top-level comment at the beginning
        setComments((prev) => [newCommentData, ...prev]);
      }
      setNewComment("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editBody.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody }),
      });
      if (!res.ok) throw new Error("Failed to update comment");
      const updatedComment = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, ...updatedComment }
            : {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId ? { ...r, ...updatedComment } : r
                ),
              }
        )
      );
      setEditingId(null);
      setEditBody("");
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      setComments((prev) =>
        prev.filter((c) => c.id !== commentId && !c.replies.some((r) => r.id === commentId))
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    if (diffDays < 7) return `منذ ${diffDays} ي`;
    return date.toLocaleDateString("ar");
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwnComment = comment.author.id === session?.user?.id;
    const isEditing = editingId === comment.id;

    return (
      <div
        key={comment.id}
        className={isReply ? "ms-12 mt-3" : "mt-4"}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <img
              src={comment.author.image || "/brand/banners/avatar-placeholder.svg"}
              alt=""
              className="size-10 rounded-full object-cover bg-oat-milk"
            />
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div>
                <textarea
                  aria-label="تعديل التعليق"
                  dir="auto"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm resize-none placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  disabled={submitting}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEdit(comment.id)}
                    disabled={submitting || !editBody.trim()}
                    className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditBody("");
                    }}
                    disabled={submitting}
                    className="px-4 py-2 border border-espresso/15 rounded-xl text-sm font-semibold hover:border-primary/40 transition-colors disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-oat-milk rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span dir="auto" className="font-semibold text-sm truncate">
                    {comment.author.name || "مجهول"}
                  </span>
                  <span className="text-[11px] text-espresso/60 shrink-0">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p dir="auto" className="text-sm text-espresso/80 leading-relaxed break-words">{comment.body}</p>
              </div>
            )}
            {!isEditing && (
              <div className="flex gap-4 mt-1.5 ps-2">
                {!isReply && (
                  <button
                    onClick={() => {
                      setReplyingTo(comment.id);
                      setNewComment("");
                    }}
                    className="text-xs font-semibold text-espresso/60 hover:text-primary transition-colors"
                  >
                    رد
                  </button>
                )}
                {isOwnComment && (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditBody(comment.body);
                      }}
                      className="text-xs font-semibold text-espresso/60 hover:text-primary transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs font-semibold text-espresso/60 hover:text-red-600 transition-colors"
                    >
                      حذف
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl mb-4">
        التعليقات ({comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)})
      </h2>

      {session?.user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <img
                src={session.user.image || "/brand/banners/avatar-placeholder.svg"}
                alt=""
                className="size-10 rounded-full object-cover bg-oat-milk"
              />
            </div>
            <div className="flex-1">
              <textarea
                aria-label={replyingTo ? "اكتب رداً" : "اكتب تعليقاً"}
                dir="auto"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  replyingTo
                    ? "اكتب رداً…"
                    : "اكتب تعليقاً…"
                }
                className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm resize-none placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                rows={3}
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-2">
                {replyingTo && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setNewComment("");
                    }}
                    className="text-sm text-espresso/60 hover:text-espresso transition-colors"
                  >
                    إلغاء الرد
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="ms-auto bg-primary text-on-primary rounded-xl px-5 py-2.5 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "جارٍ النشر…" : "نشر التعليق"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {!session?.user && (
        <p className="text-sm text-espresso/70 mb-4">
          يرجى{" "}
          <a href="/login" className="text-primary font-semibold hover:underline">
            تسجيل الدخول
          </a>{" "}
          لكتابة تعليق.
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => renderComment(comment))}
      </div>

      {loading && (
        <div className="flex justify-center mt-4">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="جارٍ التحميل…" />
        </div>
      )}

      {nextCursor && !loading && (
        <button
          onClick={() => fetchComments(nextCursor!)}
          className="mt-4 w-full py-3 text-center text-sm font-semibold text-primary hover:underline"
        >
          تحميل المزيد من التعليقات
        </button>
      )}

      {!loading && comments.length === 0 && (
        <p className="text-center text-sm text-espresso/60 py-8">
          لا توجد تعليقات بعد. كن أول من يعلّق.
        </p>
      )}
    </div>
  );
}
