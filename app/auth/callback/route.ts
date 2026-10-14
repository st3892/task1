import { NextResponse } from "next/server";
import { createClient } from "../../../lib/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.json({ error: "Sign-in didn’t finish. Please return to Sign in and try again." }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Sign-in didn’t finish. Please return to Sign in and try again." }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/", request.url));
}
