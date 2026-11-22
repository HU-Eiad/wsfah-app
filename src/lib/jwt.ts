import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
);

const ALG = "HS256";

/**
 * Mobile session token. `tv` (token version) must match User.tokenVersion,
 * so bumping that column (password change/reset, suspension) revokes every
 * token issued before it.
 */
export async function signMobileToken(payload: { id: string; role: string; tokenVersion?: number }) {
  return new SignJWT({ sub: payload.id, role: payload.role, tv: payload.tokenVersion ?? 0, typ: "access" })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyMobileToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALG] });
    // Tickets and OAuth state are signed with the same key; never accept them as sessions.
    if (payload.typ && payload.typ !== "access") return null;
    return {
      id: payload.sub as string,
      role: payload.role as string,
      tokenVersion: typeof payload.tv === "number" ? payload.tv : 0,
      issuedAt: typeof payload.iat === "number" ? payload.iat : 0,
    };
  } catch {
    return null;
  }
}

// ── Google sign-in for the mobile app (PKCE-bound, stateless) ──

export function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** OAuth `state`: proves the callback belongs to a flow we started, carries the app's PKCE challenge. */
export async function signOAuthState(codeChallenge: string) {
  return new SignJWT({ typ: "gstate", cc: codeChallenge })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);
}

export async function verifyOAuthState(state: string) {
  try {
    const { payload } = await jwtVerify(state, secret, { algorithms: [ALG] });
    if (payload.typ !== "gstate" || typeof payload.cc !== "string") return null;
    return { codeChallenge: payload.cc };
  } catch {
    return null;
  }
}

/** Short-lived ticket handed to the app via deep link; useless without the PKCE verifier. */
export async function signLoginTicket(userId: string, codeChallenge: string) {
  return new SignJWT({ typ: "gticket", sub: userId, cc: codeChallenge })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("3m")
    .sign(secret);
}

export async function verifyLoginTicket(ticket: string, codeVerifier: string) {
  try {
    const { payload } = await jwtVerify(ticket, secret, { algorithms: [ALG] });
    if (payload.typ !== "gticket" || typeof payload.sub !== "string") return null;
    if (!codeVerifier || pkceChallenge(codeVerifier) !== payload.cc) return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}
