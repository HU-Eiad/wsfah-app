"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import MaterialIcon from "./MaterialIcon";

interface ExploreUploadProps {
  companyId: string;
  companyName: string;
}

export default function ExploreUpload({ companyId, companyName }: ExploreUploadProps) {
  const t = useTranslations("exploreUpload");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        setMessage({ text: t("uploadFailed"), ok: false });
        return;
      }
      const { url } = await uploadRes.json();

      const isVideo = file.type.startsWith("video/");

      const postRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: url,
          mediaType: isVideo ? "video" : "image",
          caption: caption || null,
          companyId,
        }),
      });

      if (postRes.ok) {
        setCaption("");
        setMessage({ text: t("postSuccess"), ok: true });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const err = await postRes.json();
        setMessage({ text: err.error || t("postFailed"), ok: false });
      }
    } catch {
      setMessage({ text: t("genericError"), ok: false });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-espresso/10 p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <MaterialIcon icon="add_photo_alternate" className="text-xl" />
        </span>
        <div>
          <p className="text-sm font-bold">{t("title")}</p>
          <p className="text-xs text-espresso/60">{t.rich("postingAs", { name: companyName, brand: (chunks) => <span dir="auto" className="text-primary font-bold">{chunks}</span> })}</p>
        </div>
      </div>
      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 mb-3"
        placeholder={t("captionPlaceholder")}
        aria-label={t("captionLabel")}
        dir="auto"
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.accept = "image/*";
              fileRef.current.click();
            }
          }}
          disabled={uploading}
          className="flex-1 bg-primary text-on-primary text-sm font-bold px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <MaterialIcon icon="photo_camera" className="text-base" />
          {uploading ? t("uploading") : t("photo")}
        </button>
        <button
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.accept = "video/*";
              fileRef.current.click();
            }
          }}
          disabled={uploading}
          className="flex-1 border border-espresso/15 text-sm font-semibold px-5 py-3 rounded-xl hover:border-primary/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <MaterialIcon icon="videocam" className="text-base" />
          {uploading ? t("uploading") : t("video")}
        </button>
      </div>
      {message && (
        <p className={`text-xs mt-2 font-medium ${message.ok ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
