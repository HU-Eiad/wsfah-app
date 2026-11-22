import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "./prisma";
import { logAudit, AUDIT } from "./audit";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

/** OAuth client IDs whose ID tokens we accept (web + native apps). */
function googleAudiences(): string[] {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
  ].filter((v): v is string => !!v);
}

/** Verify a Google ID token's signature, issuer, audience and expiry. Returns null if invalid. */
export async function verifyGoogleIdToken(idToken: string) {
  const audience = googleAudiences();
  if (audience.length === 0) return null;
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience,
    });
    if (typeof payload.email !== "string" || payload.email_verified !== true) return null;
    return {
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
    };
  } catch {
    return null;
  }
}

/** Find the user for a verified Google identity, creating it on first sign-in. */
export async function findOrCreateGoogleUser(
  info: { email: string; name: string | null; picture: string | null },
  method: string
) {
  let user = await prisma.user.findUnique({ where: { email: info.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: info.email,
        name: info.name || info.email.split("@")[0],
        image: info.picture,
        emailVerified: new Date(),
      },
    });
    logAudit(user.id, AUDIT.REGISTER, "user", user.id, { email: info.email, method });
  }
  return user;
}
