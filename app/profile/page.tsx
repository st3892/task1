import { redirect } from "next/navigation";
import { createClient } from "../../lib/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Your profile";
  const initial = (profile?.first_name || user.email || "?").charAt(0).toUpperCase();

  return (
    <main id="main-content" className="page-shell">
      <div className="page-heading"><span className="eyebrow">MAKE YOURSELF AT HOME</span><h1>Your profile</h1><p>A familiar face behind the laughs.</p></div>
      <div className="profile-grid">
        <aside className="card profile-summary">
          {profile?.avatar_url ? (
            // Keep the existing public avatar URL without changing image configuration.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatar" src={profile.avatar_url} alt={`${displayName}'s profile photo`} width={112} height={112} />
          ) : <div className="avatar avatar-fallback" aria-label="Profile initials">{initial}</div>}
          <h2>{displayName}</h2>
          <p className="user-email">{user.email}</p>
          <span className="category">Tech Jokes member</span>
          <div className="profile-note">A little personality makes this place feel more like you.</div>
        </aside>
        <section className="card profile-details" aria-labelledby="details-heading">
          <h2 id="details-heading">The details that make you, you.</h2>
          <p>Update your name and add a photo to your profile.</p>
          <form action="/profile/update" method="post" encType="multipart/form-data" className="profile-form">
            <div className="form-row">
              <div className="form-field"><label htmlFor="first_name">First name</label><input id="first_name" type="text" name="first_name" autoComplete="given-name" placeholder="First name" defaultValue={profile?.first_name ?? ""} /></div>
              <div className="form-field"><label htmlFor="last_name">Last name</label><input id="last_name" type="text" name="last_name" autoComplete="family-name" placeholder="Last name" defaultValue={profile?.last_name ?? ""} /></div>
            </div>
            <div className="form-field"><label htmlFor="profile-email">Email address</label><input id="profile-email" type="email" value={user.email ?? ""} readOnly aria-describedby="email-help" /><p id="email-help" className="field-help">Connected through your Google account.</p></div>
            <div className="form-field"><label htmlFor="avatar">Profile photo</label><div className="upload-field"><input id="avatar" type="file" name="avatar" accept="image/jpeg,image/png,image/webp" aria-describedby="avatar-help" /><p id="avatar-help" className="field-help">Choose a JPG, PNG, or WebP image.</p></div></div>
            <div className="form-actions"><button className="button" type="submit">Save profile <span aria-hidden="true">↗</span></button></div>
          </form>
        </section>
      </div>
    </main>
  );
}
