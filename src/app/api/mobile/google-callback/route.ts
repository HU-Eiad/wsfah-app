import { NextRequest, NextResponse } from "next/server";
import { signMobileToken, signLoginTicket, verifyOAuthState } from "@/lib/jwt";
import { findOrCreateGoogleUser } from "@/lib/google-mobile";

const APP_CALLBACK = "wsfa://auth/callback";

function appRedirect(params: Record<string, string>) {
  return NextResponse.redirect(`${APP_CALLBACK}?${new URLSearchParams(params).toString()}`);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code) return appRedirect({ error: "no_code" });

  // New app builds always send a signed state carrying their PKCE challenge.
  // A state that is present but invalid is rejected; a missing state is the legacy flow.
  let codeChallenge: string | null = null;
  if (state) {
    const s = await verifyOAuthState(state);
    if (!s) return appRedirect({ error: "invalid_state" });
    codeChallenge = s.codeChallenge;
  }

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
    if (user.status === "SUSPENDED") return appRedirect({ error: "suspended" });

    if (codeChallenge) {
      // Short-lived ticket; only the app holding the PKCE verifier can redeem it.
      return appRedirect({ ticket: await signLoginTicket(user.id, codeChallenge) });
    }

    // Legacy flow for app builds released before the ticket exchange.
    // TODO: remove once the new app build is live in the stores.
    const token = await signMobileToken({ id: user.id, role: user.role, tokenVersion: user.tokenVersion });
    return appRedirect({ token });
  } catch {
    return appRedirect({ error: "server_error" });
  }
}
