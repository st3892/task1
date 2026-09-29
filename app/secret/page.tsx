import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/server";

export default async function SecretPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main id="main-content" className="page-shell members-shell">
      <section className="card members-card">
        <span className="category">✓ Members only</span>
        <div className="members-symbol" aria-hidden="true">✳</div>
        <span className="eyebrow">YOU’RE IN GOOD COMPANY</span>
        <h1>Welcome to the inside joke.</h1>
        <p>You can only see this page because you’re signed in.<br />Make yourself at home. We’re glad you’re here.</p>
        <div className="member-identity"><span className="member-dot" aria-hidden="true" /><span>Signed in as <strong>{user.email}</strong></span></div>
        <div className="member-actions"><Link className="button" href="/">Explore the jokes <span aria-hidden="true">↗</span></Link><Link className="button button-secondary" href="/profile">Your profile</Link></div>
      </section>
    </main>
  );
}
