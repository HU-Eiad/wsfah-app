import { NextRequest, NextResponse } from "next/server";
import { signOAuthState } from "@/lib/jwt";

/**
 * GET /api/mobile/google-auth-url?code_challenge=<base64url(sha256(verifier))>
 * Returns the Google consent URL. The signed `state` carries the app's PKCE challenge,
 * so the ticket the callback hands back can only be redeemed by the app that started the flow.
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ url: null });
  }

  const redirectUri = `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://wsfa.app"}/api/mobile/google-callback`;

  // PKCE challenge from the app: base64url(SHA-256(code_verifier)), always 43 chars.
  const codeChallenge = req.nextUrl.searchParams.get("code_challenge");
  if (!codeChallenge || !/^[A-Za-z0-9_-]{43}$/.test(codeChallenge)) {
    return NextResponse.json({ error: "code_challenge required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
  });
  params.set("state", await signOAuthState(codeChallenge));

  return NextResponse.json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    redirect_uri: redirectUri,
  });
}
