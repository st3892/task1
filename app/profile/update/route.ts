import { NextResponse } from "next/server";
import { createClient } from "../../../lib/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();

  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const avatar = formData.get("avatar") as File;

  let avatar_url: string | undefined;

  if (avatar && avatar.size > 0) {
    const fileExtension = avatar.name.split(".").pop();

    const filePath =
      `${user.id}/${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatar);

    if (uploadError) {
      console.error(uploadError);
      return new Response("Avatar upload failed", {
        status: 500,
      });
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    avatar_url = data.publicUrl;
  }

  const updates: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  } = {
    first_name,
    last_name,
  };

  if (avatar_url) {
    updates.avatar_url = avatar_url;
  }

  await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  return NextResponse.redirect(
    new URL("/profile", request.url)
  );
}