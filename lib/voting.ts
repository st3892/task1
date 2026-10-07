export type VotingItem = {
  key: string;
  id: number;
  source: "generation" | "joke";
  text: string;
  prompt: string | null;
  currentVote: 1 | -1 | null;
  upvotes: number;
  downvotes: number;
};

export type VoteRow = {
  user_id: string;
  generation_id: number | null;
  joke_id: number | null;
  vote: number;
};

export function normalizeVotingItems(
  generations: { id: number; generated_text: string; prompt: string | null }[],
  jokes: { id: number; text: string }[],
  votes: VoteRow[],
  userId: string,
): VotingItem[] {
  const items: VotingItem[] = [
    ...generations.map((row) => ({ key: `generation:${row.id}`, id: row.id, source: "generation" as const, text: row.generated_text, prompt: row.prompt, currentVote: null, upvotes: 0, downvotes: 0 })),
    ...jokes.map((row) => ({ key: `joke:${row.id}`, id: row.id, source: "joke" as const, text: row.text, prompt: null, currentVote: null, upvotes: 0, downvotes: 0 })),
  ];
  const byKey = new Map(items.map((item) => [item.key, item]));
  for (const vote of votes) {
    const key = vote.generation_id !== null ? `generation:${vote.generation_id}` : `joke:${vote.joke_id}`;
    const item = byKey.get(key);
    if (!item || (vote.vote !== 1 && vote.vote !== -1)) continue;
    if (vote.vote === 1) item.upvotes++;
    else item.downvotes++;
    if (vote.user_id === userId) item.currentVote = vote.vote;
  }
  return items;
}
