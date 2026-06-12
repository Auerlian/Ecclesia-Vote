import type { EccoAccessory, EccoExpression } from "@/components/ecco";

/**
 * Display-layer candidate profiles for the demo presidential election. The ballot engine only
 * ever sees option ids + labels — names, manifestos and mascot looks are presentation data and
 * MUST stay out of ballots, receipts and audit artifacts. All people here are fictional.
 */
export interface CandidateProfile {
  optionId: string;
  name: string;
  /** One-line campaign slogan shown on cards. */
  tagline: string;
  /** Short authored summary shown before the full manifesto (the v0.2 roadmap generates these). */
  summary: string;
  manifesto: string;
  year: string;
  petal: string;
  accessory: EccoAccessory;
  expression: EccoExpression;
}

export const PRESIDENT_CANDIDATES: CandidateProfile[] = [
  {
    optionId: "cand-aisha",
    name: "Aisha Khan",
    tagline: "Bigger debates. Bolder motions.",
    summary: "Wants weekly public debates, a beginners' night, and to stream the big ones.",
    manifesto:
      "Our best nights are the ones where everyone argues and nobody checks their phone. I'll run a " +
      "public debate every week, start a beginners' night where new members speak first, and stream " +
      "our headline debates so the whole campus can heckle politely. Democracy is a contact sport — " +
      "let's sell tickets.",
    year: "2nd year · Politics",
    petal: "#3D6BFF",
    accessory: "glasses",
    expression: "happy",
  },
  {
    optionId: "cand-ben",
    name: "Ben Okafor",
    tagline: "A social every fortnight, no exceptions.",
    summary: "More socials, a freshers' buddy scheme, and snacks at every single meeting.",
    manifesto:
      "Societies live or die on whether people actually want to be in the room. My plan: a social " +
      "every two weeks, a buddy scheme so freshers never stand awkwardly by the door, and a snack " +
      "budget written into the constitution. You can't filibuster on an empty stomach.",
    year: "3rd year · Economics",
    petal: "#FF5C39",
    accessory: "cap",
    expression: "joy",
  },
  {
    optionId: "cand-chloe",
    name: "Chloé Mercier",
    tagline: "Take us to nationals.",
    summary: "Competition squad, proper coaching, and a trophy cabinet that needs dusting.",
    manifesto:
      "We have the talent to compete nationally — what we lack is structure. I'll set up a " +
      "competition squad with regular coaching, get us entered into three intervarsity tournaments, " +
      "and fundraise for travel so nobody is left behind. The trophy cabinet is empty. That's a " +
      "to-do list, not a fact.",
    year: "2nd year · Law",
    petal: "#8B4DFF",
    accessory: "flower",
    expression: "wink",
  },
  {
    optionId: "cand-dev",
    name: "Dev Patel",
    tagline: "Debates, but make them memes.",
    summary: "Meme-able motions, a society podcast, and collabs with other societies.",
    manifesto:
      "Nobody joins a society from a poster in a corridor. I'll run motions people actually want to " +
      "share ('This House Would Ban Group Projects'), launch a five-minute society podcast, and " +
      "collab with other societies so our debates have real audiences. If it's not worth posting, " +
      "it's not worth doing.",
    year: "1st year · Computer Science",
    petal: "#12B97E",
    accessory: "moustache",
    expression: "happy",
  },
];

export function candidateByOptionId(optionId: string): CandidateProfile | undefined {
  return PRESIDENT_CANDIDATES.find((c) => c.optionId === optionId);
}
