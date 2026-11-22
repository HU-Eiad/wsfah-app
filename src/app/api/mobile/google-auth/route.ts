import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signMobileToken, verifyLoginTicket } from "@/lib/jwt";
import { verifyGoogleIdToken, findOrCreateGoogleUser } from "@/lib/google-mobile";

/**
 * Exchange a Google sign-in for a mobile session token.
 *
 * Body, one of:
 *  - { ticket, code_verifier }  ticket from /api/mobile/google-callback, bound to the app's PKCE verifier
 *  - { id_token }               Google ID token from a native Google Sign-In SDK (signature + audience verified)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
    }
    const { ticket, code_verifier, id_token } = body as Record<string, unknown>;

    let user;
    if (typeof ticket === "string") {
      const t = await verifyLoginTicket(ticket, typeof code_verifier === "string" ? code_verifier : "");
      if (!t) {
        return NextResponse.json({ error: "انتهت صلاحية تسجيل الدخول، حاول مرة أخرى" }, { status: 401 });
      }
      user = await prisma.user.findUnique({ where: { id: t.userId } });
    } else if (typeof id_token === "string") {
      const info = await verifyGoogleIdToken(id_token);
      if (!info) {
        return NextResponse.json({ error: "فشل التحقق من Google" }, { status: 401 });
      }
      user = await findOrCreateGoogleUser(info, "google-mobile");
    } else {
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "الحساب موقوف" }, { status: 403 });
    }

    const token = await signMobileToken({ id: user.id, role: user.role, tokenVersion: user.tokenVersion });
    return NextResponse.json({ token, userId: user.id });
  } catch (error) {
    console.error("Mobile Google auth error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}
