import { redirect } from "next/navigation";
import { createClient } from "../../lib/server";
import { normalizeVotingItems, type VoteRow, type VotingItem } from "../../lib/voting";
import VotingDeck from "../components/voting-deck";

// Read all pages so Supabase's row limit cannot hide unrated jokes or votes.
async function readAll<T>(query: { range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }> }): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query.range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 500) return rows;
  }
}

export default async function SecretPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  let items: VotingItem[];
  try {
    const [generations, jokes, votes] = await Promise.all([
      readAll<{ id: number; generated_text: string; prompt: string | null }>(supabase.from("generations").select("id, generated_text, prompt").order("created_at", { ascending: false, nullsFirst: false }).order("id", { ascending: false })),
      readAll<{ id: number; text: string }>(supabase.from("jokes").select("id, text").order("id", { ascending: false })),
      readAll<VoteRow>(supabase.from("votes").select("user_id, generation_id, joke_id, vote").order("id", { ascending: true })),
    ]);
    items = normalizeVotingItems(generations, jokes, votes, user.id);
  } catch {
    return <main id="main-content" className="page-shell taste-test-page"><div className="card empty-state" role="alert"><h1>Couldn’t load the voting kitchen</h1><p>Please refresh and try again in a moment.</p></div></main>;
  }

  return (
    <main id="main-content" className="page-shell taste-test-page">
      <div className="page-heading"><span className="eyebrow">PULL UP A CHAIR</span><h1>Taste Test</h1><p>One joke at a time. Trust your taste buds.</p></div>
      <VotingDeck key={user.id} items={items} userId={user.id} />
    </main>
  );
}
