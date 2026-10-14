import { NextResponse } from "next/server";
import { createClient } from "../../../lib/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url), 303);
    }

    const formData = await request.formData();

    const first_name = formData.get("first_name");
    const last_name = formData.get("last_name");
    const avatar = formData.get("avatar");
    if (typeof first_name !== "string" || typeof last_name !== "string" || (avatar !== null && !(avatar instanceof File))) {
      return new Response("Please send valid profile details.", { status: 400 });
    }

    let avatar_url: string | undefined;

    if (avatar && avatar.size > 0) {
      const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const fileExtension = extensions[avatar.type];
      if (!fileExtension || avatar.size > 5 * 1024 * 1024) {
        return new Response("Please choose a JPG, PNG, or WebP image up to 5 MB.", { status: 400 });
      }
      const header = new Uint8Array(await avatar.slice(0, 12).arrayBuffer());
      const validImage = avatar.type === "image/jpeg" ? header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
        : avatar.type === "image/png" ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => header[index] === byte)
          : new TextDecoder().decode(header.slice(0, 4)) === "RIFF" && new TextDecoder().decode(header.slice(8, 12)) === "WEBP";
      if (!validImage) return new Response("Please choose a valid JPG, PNG, or WebP image.", { status: 400 });

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

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (updateError) {
      return new Response("Couldn’t save your profile. Please try again.", { status: 500 });
    }

    return NextResponse.redirect(
      new URL("/profile", request.url),
      303
    );
  } catch {
    return new Response("Couldn’t save your profile. Please try again.", { status: 500 });
  }
}
