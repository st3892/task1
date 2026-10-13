export const MODERATION_MESSAGE = "This prompt is inappropriate for Whisk Takers. Keep it sweet and try a cooking, baking, college, NYC, or everyday-life topic.";

// Local, deterministic checks: no external API calls and no prompt logging.
// This catches obvious requests, not every language or adversarial paraphrase.
const slurs = /\b(?:nigg(?:er|a)s?|fags?|fagg?ots?|dykes?|trann(?:y|ies)|retards?|kikes?|chinks?|spics?|wetbacks?|ragheads?|towelheads?)\b/;
const unsafeRequests = /\b(?:slurs?|racial epithets?|hate speech|hateful stereotypes?|racist|sexist|homophobic|transphobic|antisemitic|anti semitic|islamophobic|ableist|xenophobic)\b/;
const explicitSex = /\b(?:porn(?:ographic|ography)?|xxx|nsfw|explicit sex(?:ual)?|sexually explicit|graphic sex|erotic(?:a)?|blowjobs?|handjobs?|orgasm\w*|masturbat\w*|rape|incest|anal sex|oral sex|sexual intercourse|penis|vagina|cock|pussy|cum)\b/;
const protectedGroups = /\b(?:sexual orientation|race|racial|ethnic(?:ity)?|religio(?:n|us)|gender(?: identity)?|disabilit\w*|nationalit\w*|protected (?:groups?|characteristics?)|gays?|ghey|lesbians?|bisexuals?|queer|lgbt\w*|homosexuals?|trans(?:gender|sexual)?s?|nonbinary|non binary|women|woman|men|man|female|male|girls?|boys?|black|white|asian|african|latino|latina|hispanic|indigenous|native american|jewish|jews?|muslims?|islam(?:ic)?|christians?|catholics?|protestants?|mormons?|hindu\w*|buddhis\w*|sikhs?|atheists?|disabled|handicapped|mental illness|mental health|down syndrome|cerebral palsy|autis\w*|blind|deaf|immigrants?|refugees?|mexicans?|indians?|chinese|japanese|koreans?|americans?|british|french|russians?|ukrainians?|israelis?|palestinians?|arabs?|irish|italians?|germans?|elderly|old people|pregnant)\b/;
const degrading = /\b(?:insult\w*|degrad\w*|demean\w*|humiliat\w*|mock\w*|ridicul\w*|roast\w*|belittl\w*|offensiv\w*|hateful|hate|inferior|superior|subhuman|disgusting|stupid|dumb|lazy|dirty|worthless|ugly|vermin|stereotyp\w*)\b|\b(?:make fun of|put down|laugh at)\b/;
const harassment = /\b(?:harass\w*|bully\w*|dox\w*|threaten\w*|death threats?|kill yourself|ruin (?:his|her|their) (?:life|reputation))\b/;
const personalTarget = /\b(?:my|our|his|her|their)\s+(?:ex|classmate|roommate|coworker|co worker|boss|teacher|professor|neighbor|friend|girlfriend|boyfriend)\b|@\w+|\b(?:named|called)\s+\w+/;

export function isPromptRejected(prompt: string): boolean {
  const normalized = prompt.normalize("NFKC").toLowerCase()
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[013457@$]/g, (character) => ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" })[character]!)
    .replace(/[-_]/g, " ").replace(/\s+/g, " ");
  // Also catch common punctuation-separated slurs (e.g. f.a.g.g.o.t).
  const joined = normalized.replace(/(?<=[a-z])[.*](?=[a-z])/g, "");
  if (slurs.test(joined) || unsafeRequests.test(normalized) || explicitSex.test(normalized) || harassment.test(normalized)) return true;

  // This generator is intentionally conservative: identity terms do not need
  // an explicit "joke", "insult", or "mock" cue to be rejected. This catches
  // statements such as "you are gay" before the route can call Gemini.
  // Only unambiguous culinary uses of otherwise sensitive words are exempt.
  const identityText = joined
    .replace(/\b(?:white|black) (?:chocolate|coffee|pepper|beans?|rice|sesame|truffle|tea)\b/g, "ingredient")
    .replace(/\bblind (?:taste test|baking|bake)\b/g, "cooking technique");
  if (protectedGroups.test(identityText)) return true;
  // Catch punctuation/space-separated versions of the most common identity terms.
  if (/\b(?:g[\W_]*a[\W_]*y|l[\W_]*e[\W_]*s[\W_]*b[\W_]*i[\W_]*a[\W_]*n|q[\W_]*u[\W_]*e[\W_]*e[\W_]*r|t[\W_]*r[\W_]*a[\W_]*n[\W_]*s)\b/.test(normalized)) return true;
  // Named/direct personal insults are harassment; ordinary dating/work humor is allowed.
  return degrading.test(normalized) && (personalTarget.test(normalized) || /@\w+/.test(prompt)
    || /\b(?:[Ii]nsult|[Hh]umiliate|[Rr]idicule|[Rr]oast|[Mm]ock|[Mm]ake fun of)\s+[A-Z][a-z]+\b/.test(prompt));
}

// A secondary guard prevents model safety blocks/refusals from being saved as jokes.
export function isGenerationRefusal(text: string): boolean {
  return /INAPPROPRIATE_PROMPT/i.test(text)
    || /\b(?:i\s+(?:cannot|can't|won't|will not|am unable to)|i'm unable to|sorry[, ]+(?:but )?i)\s+(?:help|provide|generate|write|create|assist|comply)\b/i.test(text)
    || /\b(?:this (?:prompt|request) is inappropriate|(?:cannot|can't|won't) (?:generate|provide|create) (?:hateful|offensive|explicit|harmful)|let['’]s (?:keep (?:it|things|the kitchen)|try a (?:safer|different) topic))\b/i.test(text);
}
