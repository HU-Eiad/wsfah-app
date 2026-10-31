"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MaterialIcon from "@/components/MaterialIcon";
import BottomNav from "@/components/BottomNav";
import DarkModeToggle from "@/components/DarkModeToggle";
import LanguageSwitch from "@/components/LanguageSwitch";
import BrandIcon from "@/components/BrandIcon";
import { logout } from "@/app/actions";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  image: string | null;
  role: string;
}

interface PrivacyData {
  privacyFollowers: string;
  privacyLikes: string;
  privacySaved: string;
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacyData>({
    privacyFollowers: "everyone",
    privacyLikes: "public",
    privacySaved: "private",
  });
  const [privacySaving, setPrivacySaving] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      const patchRes = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
      if (!patchRes.ok) throw new Error("Save failed");
      const updated = await patchRes.json();
      setUser((prev) => (prev ? { ...prev, image: updated.image } : prev));
      setMessage({ type: "success", text: t("messages.avatarUpdated") });
    } catch {
      setMessage({ type: "error", text: t("messages.avatarFailed") });
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me");
        if (cancelled) return;
        if (!res.ok) {
          window.location.href = "/login";
          return;
        }
        const data: UserData = await res.json();
        setUser(data);
        setName(data.name || "");
        setBio(data.bio || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
      } catch {
        if (!cancelled) window.location.href = "/login";
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUser();
    // Fetch privacy settings
    fetch("/api/privacy")
      .then((r) => { if (r.ok) return r.json(); throw new Error(); })
      .then((data: PrivacyData) => { if (!cancelled) setPrivacy(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const body: Record<string, string> = {};

      if (name !== (user?.name || "")) body.name = name;
      if (bio !== (user?.bio || "")) body.bio = bio;
      if (email !== (user?.email || "")) body.email = email;
      if (phone !== (user?.phone || "")) body.phone = phone;
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      if (Object.keys(body).length === 0) {
        setMessage({ type: "error", text: t("messages.noChanges") });
        setSaving(false);
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || t("messages.saveFailed") });
      } else {
        const updated = await res.json();
        setUser((prev) => (prev ? { ...prev, ...updated } : prev));
        setCurrentPassword("");
        setNewPassword("");
        setMessage({ type: "success", text: t("messages.profileUpdated") });
      }
    } catch {
      setMessage({ type: "error", text: t("messages.genericError") });
    } finally {
      setSaving(false);
    }
  };

  const roleBadgeLabel = (role: string) => {
    switch (role) {
      case "CREATOR":
        return t("roles.CREATOR");
      case "BRAND_ADMIN":
        return t("roles.BRAND_ADMIN");
      default:
        return t("roles.USER");
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const avatarUrl = user.image || "/brand/banners/avatar-placeholder.svg";

  const inputClass =
    "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass = "text-xs font-semibold text-espresso/70 mb-2 block";
  const segClass = (active: boolean) =>
    `flex-1 text-xs font-semibold py-2 rounded-full transition-colors ${
      active ? "bg-primary text-on-primary" : "bg-oat-milk text-espresso/70"
    }`;

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link
          href="/profile"
          aria-label={t("back")}
          className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk"
        >
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">{t("title")}</h1>
      </header>

      <main className="flex-1 pb-28 px-4 max-w-screen-sm mx-auto w-full">
        {/* Avatar + Role */}
        <div className="flex flex-col items-center pt-8 pb-6 gap-3">
          <div className="relative">
            <img
              src={avatarUrl}
              alt=""
              className="size-24 rounded-full object-cover ring-4 ring-surface bg-oat-milk"
            />
            <label
              aria-label={t("changePhoto")}
              className="absolute bottom-0 end-0 size-9 rounded-full bg-primary text-on-primary flex items-center justify-center cursor-pointer ring-4 ring-background-light hover:bg-primary/90 transition-colors"
            >
              {uploadingAvatar ? (
                <div className="size-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <MaterialIcon icon="photo_camera" className="text-base" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </label>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
            <BrandIcon name="verified" className="text-sm" />
            {roleBadgeLabel(user.role)}
          </span>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Fields */}
        <section className="mb-8">
          <h2 className="text-xl mb-4">{t("account.title")}</h2>
          <div className="bg-surface rounded-2xl border border-espresso/10 p-4 space-y-4">
            <div>
              <label htmlFor="settings-name" className={labelClass}>
                {t("account.name")}
              </label>
              <input
                id="settings-name"
                dir="auto"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("account.namePlaceholder")}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="settings-bio" className={labelClass}>
                {t("account.bio")}
              </label>
              <textarea
                id="settings-bio"
                dir="auto"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("account.bioPlaceholder")}
                rows={3}
                className={`${inputClass} leading-relaxed resize-none`}
              />
            </div>

            <div>
              <label htmlFor="settings-email" className={labelClass}>
                {t("account.email")}
              </label>
              <input
                id="settings-email"
                dir="ltr"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`${inputClass} rtl:text-right`}
              />
            </div>

            <div>
              <label htmlFor="settings-phone" className={labelClass}>
                {t("account.phone")}
              </label>
              <input
                id="settings-phone"
                dir="ltr"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className={`${inputClass} rtl:text-right`}
              />
            </div>
          </div>
        </section>

        {/* Password Section */}
        <section className="mb-6">
          <h2 className="text-xl mb-4">{t("password.title")}</h2>
          <div className="bg-surface rounded-2xl border border-espresso/10 p-4 space-y-4">
            <div>
              <label htmlFor="settings-current-password" className={labelClass}>
                {t("password.current")}
              </label>
              <input
                id="settings-current-password"
                dir="auto"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("password.currentPlaceholder")}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="settings-new-password" className={labelClass}>
                {t("password.new")}
              </label>
              <input
                id="settings-new-password"
                dir="auto"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("password.newPlaceholder")}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-8"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-on-primary border-t-transparent" />
              {t("saving")}
            </>
          ) : (
            <>
              <MaterialIcon icon="save" className="text-lg" />
              {t("saveChanges")}
            </>
          )}
        </button>

        {/* Privacy Settings */}
        <section className="mb-8">
          <h2 className="text-xl mb-4">{t("privacy.title")}</h2>

          <div className="bg-surface rounded-2xl border border-espresso/10 divide-y divide-espresso/10 mb-4">
            {/* Who sees followers */}
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="size-9 rounded-full bg-oat-milk flex items-center justify-center text-espresso/70 shrink-0">
                  <MaterialIcon icon="group" className="text-xl" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t("privacy.followersTitle")}</p>
                  <p className="text-xs text-espresso/60 leading-relaxed">{t("privacy.followersHint")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { value: "everyone", label: t("privacy.everyone") },
                  { value: "followers", label: t("privacy.followers") },
                  { value: "none", label: t("privacy.none") },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPrivacy((p) => ({ ...p, privacyFollowers: opt.value }))}
                    className={segClass(privacy.privacyFollowers === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Liked recipes visibility */}
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="size-9 rounded-full bg-oat-milk flex items-center justify-center text-espresso/70 shrink-0">
                  <MaterialIcon icon="favorite" className="text-xl" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t("privacy.likesTitle")}</p>
                  <p className="text-xs text-espresso/60 leading-relaxed">{t("privacy.likesHint")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { value: "public", label: t("privacy.public") },
                  { value: "private", label: t("privacy.private") },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPrivacy((p) => ({ ...p, privacyLikes: opt.value }))}
                    className={segClass(privacy.privacyLikes === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Saved recipes visibility */}
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="size-9 rounded-full bg-oat-milk flex items-center justify-center text-espresso/70 shrink-0">
                  <MaterialIcon icon="bookmark" className="text-xl" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t("privacy.savedTitle")}</p>
                  <p className="text-xs text-espresso/60 leading-relaxed">{t("privacy.savedHint")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { value: "public", label: t("privacy.public") },
                  { value: "private", label: t("privacy.private") },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPrivacy((p) => ({ ...p, privacySaved: opt.value }))}
                    className={segClass(privacy.privacySaved === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save privacy */}
          <button
            onClick={async () => {
              setPrivacySaving(true);
              try {
                const res = await fetch("/api/privacy", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(privacy),
                });
                if (res.ok) {
                  setMessage({ type: "success", text: t("messages.privacySaved") });
                }
              } catch {
                setMessage({ type: "error", text: t("messages.privacyFailed") });
              } finally {
                setPrivacySaving(false);
              }
            }}
            disabled={privacySaving}
            className="w-full border border-espresso/15 rounded-xl px-5 py-3 font-semibold text-sm hover:border-primary/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <MaterialIcon icon="shield" className="text-lg" />
            {privacySaving ? t("saving") : t("privacy.save")}
          </button>
        </section>

        {/* Appearance & account links */}
        <section className="mb-6">
          <h2 className="text-xl mb-4">{t("app.title")}</h2>
          <div className="bg-surface rounded-2xl border border-espresso/10 divide-y divide-espresso/10 overflow-hidden">
            <DarkModeToggle />
            <LanguageSwitch variant="row" />

            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-oat-milk/50 transition-colors"
            >
              <span className="size-9 rounded-full bg-oat-milk flex items-center justify-center text-espresso/70">
                <MaterialIcon icon="person" className="text-xl" />
              </span>
              <span className="text-sm font-semibold flex-1">{t("app.viewProfile")}</span>
              <MaterialIcon icon="chevron_left" className="text-espresso/50" />
            </Link>

            <Link
              href="/pricing"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-oat-milk/50 transition-colors"
            >
              <span className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MaterialIcon icon="workspace_premium" className="text-xl" />
              </span>
              <span className="text-sm font-semibold flex-1">{t("app.manageSubscription")}</span>
              <MaterialIcon icon="chevron_left" className="text-espresso/50" />
            </Link>

            {/* Sign Out */}
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-start text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="size-9 rounded-full bg-red-50 flex items-center justify-center">
                <MaterialIcon icon="logout" className="text-xl" />
              </span>
              <span className="text-sm font-semibold flex-1">{t("app.signOut")}</span>
            </button>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
