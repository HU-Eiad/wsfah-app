import { NextRequest, NextResponse } from "next/server";
import { signLoginTicket, verifyOAuthState } from "@/lib/jwt";
import { findOrCreateGoogleUser } from "@/lib/google-mobile";

const APP_CALLBACK = "wsfa://auth/callback";

function appRedirect(params: Record<string, string>) {
  return NextResponse.redirect(`${APP_CALLBACK}?${new URLSearchParams(params).toString()}`);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code) return appRedirect({ error: "no_code" });

  // The signed state proves we started this flow and carries the app's PKCE challenge.
  const s = state ? await verifyOAuthState(state) : null;
  if (!s) return appRedirect({ error: "invalid_state" });
  const codeChallenge = s.codeChallenge;

  try {
    const redirectUri = `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://wsfa.app"}/api/mobile/google-callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return appRedirect({ error: "google_failed" });

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoRes.json();
    if (!userInfoRes.ok || !userInfo.email || userInfo.verified_email === false) {
      return appRedirect({ error: "no_email" });
    }

    const user = await findOrCreateGoogleUser(
      { email: String(userInfo.email), name: userInfo.name || null, picture: userInfo.picture || null },
      "google-mobile"
    );
    if (user.status === "SUSPENDED" || user.status === "DELETED") return appRedirect({ error: "suspended" });

    // Short-lived ticket; only the app holding the PKCE verifier can redeem it.
    return appRedirect({ ticket: await signLoginTicket(user.id, codeChallenge) });
  } catch {
    return appRedirect({ error: "server_error" });
  }
}
