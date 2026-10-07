import { createClient } from "../../lib/server";
import Link from "next/link";
import GenerationForm from "./generation-form";

export default async function Generations() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const { data: generations, error } = await supabase
    .from("generations")
    .select("id, prompt, generated_text, created_at")
    .order("created_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(6);

  return (
    <section aria-label="AI joke kitchen">
      {!authError && user ? <GenerationForm /> : <div className="card empty-state"><h2>Sign in to cook up an AI creation.</h2><p>Your next great joke starts with one idea.</p><Link className="button" href="/login">Sign in</Link></div>}
      {error ? (
        <div className="card empty-state" role="alert"><h3>Couldn’t load the creations</h3><p>Please try again in a little while.</p></div>
      ) : generations?.length ? (
        <div className="jokes-section"><div className="section-heading"><h2>Fresh from the oven</h2><Link className="button button-secondary button-small" href="/secret">Go to Voting</Link></div><ul className="joke-grid">
          {generations.map((generation) => (
            <li key={generation.id} className="card generation-card recipe-card">
              <span className="recipe-label">HOUSE SPECIAL · FRESHLY WHIPPED</span><p className="generation-text">{generation.generated_text}</p>
              <p className="generation-prompt"><strong>Prompt:</strong> {generation.prompt}</p>
              {generation.created_at && (
                <time className="small-note" dateTime={generation.created_at}>
                  {new Date(generation.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                </time>
              )}
            </li>
          ))}
        </ul></div>
      ) : null}
    </section>
  );
}
