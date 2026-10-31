"use client";

import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface Activity {
  id: string;
  userId: string;
  type: string;
  entityId: string | null;
  entityType: string | null;
  metadata: string | null;
  createdAt: string;
  user: User;
}

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
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
    return date.toLocaleDateString("ar-u-nu-latn");
  };

  const renderActivity = () => {
    const userName = activity.user.name || "شخص ما";
    const userAvatar = activity.user.image || "/brand/banners/avatar-placeholder.svg";

    switch (activity.type) {
      case "RECIPE_CREATE":
        return (
          <div className="flex items-start gap-3">
            <Link
              href={`/recipe/${activity.entityId}`}
              className="shrink-0"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="size-10 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-espresso/70 leading-relaxed">
                <span dir="auto" className="font-bold text-espresso">{userName}</span>
                {" "}
                أنشأ وصفة جديدة
              </p>
              <Link
                href={`/recipe/${activity.entityId}`}
                className="inline-block mt-1 text-sm font-semibold text-primary hover:underline"
              >
                عرض الوصفة
              </Link>
            </div>
          </div>
        );

      case "LIKE":
      case "SAVE":
        return (
          <div className="flex items-start gap-3">
            <Link
              href={`/recipe/${activity.entityId}`}
              className="shrink-0"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="size-10 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-espresso/70 leading-relaxed">
                <span dir="auto" className="font-bold text-espresso">{userName}</span>
                {" "}
                {activity.type === "LIKE" ? "أعجب بـ" : "حفظ"}
                {" "}
                وصفة
              </p>
              <Link
                href={`/recipe/${activity.entityId}`}
                className="inline-block mt-1 text-sm font-semibold text-primary hover:underline"
              >
                عرض الوصفة
              </Link>
            </div>
          </div>
        );

      case "FOLLOW":
        return (
          <div className="flex items-start gap-3">
            <Link
              href={`/profile/${activity.userId}`}
              className="shrink-0"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="size-10 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-espresso/70 leading-relaxed">
                <span dir="auto" className="font-bold text-espresso">{userName}</span>
                {" "}
                بدأ متابعة
                {" "}
                <Link
                  href={`/profile/${activity.userId}`}
                  dir="auto"
                  className="font-semibold text-primary hover:underline"
                >
                  {activity.entityId}
                </Link>
              </p>
            </div>
          </div>
        );

      case "COMMENT_CREATE":
        return (
          <div className="flex items-start gap-3">
            <Link
              href={activity.entityType === "recipe" ? `/recipe/${activity.entityId}` : `/explore/${activity.entityId}`}
              className="shrink-0"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="size-10 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-espresso/70 leading-relaxed">
                <span dir="auto" className="font-bold text-espresso">{userName}</span>
                {" "}
                علّق على{" "}
                {activity.entityType === "recipe" ? "وصفة" : "منشور"}
              </p>
              <Link
                href={activity.entityType === "recipe" ? `/recipe/${activity.entityId}` : `/explore/${activity.entityId}`}
                className="inline-block mt-1 text-sm font-semibold text-primary hover:underline"
              >
                عرض {activity.entityType === "recipe" ? "الوصفة" : "المنشور"}
              </Link>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-start gap-3">
            <img
              src={userAvatar}
              alt={userName}
              className="size-10 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-espresso/70 leading-relaxed">
                <span dir="auto" className="font-bold text-espresso">{userName}</span>
                {" "}
                {activity.type.toLowerCase().replace(/_/g, " ")}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-espresso/10 p-4">
      {renderActivity()}
      <p className="text-xs text-espresso/60 mt-2 ps-[52px]">
        {formatDate(activity.createdAt)}
      </p>
    </div>
  );
}
