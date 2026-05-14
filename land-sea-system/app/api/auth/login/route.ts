import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    const isJsonRequest = contentType.includes("application/json");
    const requestData = isJsonRequest
      ? await req.json()
      : Object.fromEntries(await req.formData());
    const email = String(requestData.email || "").trim().toLowerCase();
    const password = String(requestData.password || "");

    if (!email || !password) {
      return createLoginErrorResponse(
        req,
        isJsonRequest,
        "Email and password are required.",
        400
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return createLoginErrorResponse(
        req,
        isJsonRequest,
        "Invalid email or password.",
        401
      );
    }

    if (!user.isActive) {
      return createLoginErrorResponse(
        req,
        isJsonRequest,
        "This account is inactive.",
        403
      );
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);

    if (!passwordOk) {
      return createLoginErrorResponse(
        req,
        isJsonRequest,
        "Invalid email or password.",
        401
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const response = isJsonRequest
      ? NextResponse.json({ success: true })
      : NextResponse.redirect(new URL("/", req.url), { status: 303 });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return createLoginErrorResponse(
      req,
      (req.headers.get("content-type") ?? "").includes("application/json"),
      "Something went wrong during login.",
      500
    );
  }
}

function createLoginErrorResponse(
  req: Request,
  isJsonRequest: boolean,
  error: string,
  status: number
) {
  if (isJsonRequest) {
    return NextResponse.json(
      { error },
      { status }
    );
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("error", error);

  return NextResponse.redirect(loginUrl, { status: 303 });
}
