import ChefHat from "../components/chef-hat";
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
    <main id="main-content" className="page-shell kitchen-profile">
      <div className="page-heading"><span className="eyebrow">THE WHISK TAKERS KITCHEN CLUB</span><h1>My Kitchen Card</h1><p>A familiar face. A very personal recipe.</p></div>
      <div className="profile-grid">
        <aside className="card profile-summary"><span className="kitchen-id-label">KITCHEN PASSPORT</span><ChefHat />
          {profile?.avatar_url ? (
            // Keep the existing public avatar URL without changing image configuration.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatar" src={profile.avatar_url} alt={`${displayName}'s profile photo`} width={112} height={112} />
          ) : <div className="avatar avatar-fallback" aria-label="Profile initials">{initial}</div>}
          <span className="chef-name-label">CHEF NAME</span><h2>{displayName}</h2>
          <p className="user-email">{user.email}</p>
          <span className="category">Whisk Takers member</span>
          <div className="profile-note">Made with a little personality. No secret ingredients required.</div>
        </aside>
        <section className="card profile-details" aria-labelledby="details-heading">
          <h2 id="details-heading">Your secret ingredients.</h2>
          <p>Same chef, fresh garnish. Update your name and kitchen portrait.</p>
          <form action="/profile/update" method="post" encType="multipart/form-data" className="profile-form">
            <div className="form-row">
              <div className="form-field"><label htmlFor="first_name">Chef’s first name</label><input id="first_name" type="text" name="first_name" autoComplete="given-name" placeholder="First name" defaultValue={profile?.first_name ?? ""} /></div>
              <div className="form-field"><label htmlFor="last_name">Chef’s last name</label><input id="last_name" type="text" name="last_name" autoComplete="family-name" placeholder="Last name" defaultValue={profile?.last_name ?? ""} /></div>
            </div>
            <div className="form-field"><label htmlFor="profile-email">Email address</label><input id="profile-email" type="email" value={user.email ?? ""} readOnly aria-describedby="email-help" /><p id="email-help" className="field-help">Connected through your Google account.</p></div>
            <div className="form-field"><label htmlFor="avatar">Kitchen portrait</label><div className="upload-field"><input id="avatar" type="file" name="avatar" accept="image/jpeg,image/png,image/webp" aria-describedby="avatar-help" /><p id="avatar-help" className="field-help">Choose a JPG, PNG, or WebP image.</p></div></div>
            <div className="form-actions"><button className="button" type="submit">Save profile <span aria-hidden="true">↗</span></button></div>
          </form>
        </section>
      </div>
    </main>
  );
}
