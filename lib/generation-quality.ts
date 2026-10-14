// Conservative checks for obvious truncation, not a semantic joke evaluator.
export function isCompleteGeneration(text: string, finishReasons: string[] = []): boolean {
  const trimmed = text.trim();
  const words = trimmed.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu) ?? [];
  if (trimmed.length < 24 || words.length < 5 || words.length > 60) return false;
  if (finishReasons.includes("MAX_TOKENS") || trimmed.includes("\uFFFD")) return false;
  if (/^(?:here['’]?s|here is) (?:a|the|your) joke\b/i.test(trimmed) || /```/.test(trimmed)) return false;
  // A terminal mark is deliberately required to catch mid-sentence/mid-word cuts.
  if (!/[.!?]["'’”)]*$/.test(trimmed) || /(?:\.{2,}|…)["'’”)]*$/.test(trimmed)) return false;
  const lastWord = words[words.length - 1].toLowerCase();
  return !/^(?:a|an|the|and|or|but|because|although|while|when|if|that|which|whose|to|of|with|without|from|into|onto|than|every|each|my|your|our|their|its)$/.test(lastWord);
}
