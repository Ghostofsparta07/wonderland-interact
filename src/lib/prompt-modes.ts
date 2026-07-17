export type ModeId = "development" | "writing" | "design" | "debugging" | "business";

export interface Mode {
  id: ModeId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  vibe: string;
  fieldLabels: Record<keyof PromptFields, { label: string; placeholder: string; hint?: string }>;
  presets: string[];
}

export interface PromptFields {
  role: string;
  task: string;
  context: string;
  constraints: string;
  examples: string;
  outputFormat: string;
  tone: string;
  successCriteria: string;
  negativeInstructions: string;
}

export const emptyPrompt: PromptFields = {
  role: "",
  task: "",
  context: "",
  constraints: "",
  examples: "",
  outputFormat: "",
  tone: "",
  successCriteria: "",
  negativeInstructions: "",
};

export const MODES: Record<ModeId, Mode> = {
  development: {
    id: "development",
    name: "Development",
    tagline: "// build.systems",
    description: "Phosphor terminals, code architecture, senior engineer energy.",
    icon: "▮",
    vibe: "Type like a hacker. Ship like a staff engineer.",
    fieldLabels: {
      role: { label: "SYSTEM_ROLE", placeholder: "senior_backend_engineer()", hint: "e.g. 'Senior TypeScript engineer, 10y in distributed systems'" },
      task: { label: "TASK.exec", placeholder: "refactor auth middleware to support JWT rotation", hint: "The concrete engineering job." },
      context: { label: "CONTEXT.load", placeholder: "Node 20, Express, PostgreSQL, existing session-based auth in ./src/auth", hint: "Stack, files, current state." },
      constraints: { label: "CONSTRAINTS[]", placeholder: "no breaking API changes; must pass existing test suite; SSR-safe", hint: "Hard rules the code must satisfy." },
      examples: { label: "EXAMPLES.ref", placeholder: "Existing pattern: `withAuth(handler)` in ./src/auth/wrap.ts" },
      outputFormat: { label: "OUTPUT.schema", placeholder: "Unified diff patch, followed by a migration checklist" },
      tone: { label: "TONE.set", placeholder: "Direct, no filler. Assume expert reader." },
      successCriteria: { label: "SUCCESS.eq", placeholder: "All routes still authenticate; rotation window ≤ 60s; zero downtime." },
      negativeInstructions: { label: "NEGATIVE.excl", placeholder: "Do not introduce new dependencies. Do not rewrite unrelated files." },
    },
    presets: ["Refactor legacy code", "Debug a production bug", "Design an API schema", "Write unit tests", "Optimize a slow query"],
  },
  writing: {
    id: "writing",
    name: "Writing",
    tagline: "of pen & thought",
    description: "Cream paper, warm serifs, an editor's steady margin.",
    icon: "✒",
    vibe: "Slow the sentence down. Choose every word.",
    fieldLabels: {
      role: { label: "The Voice", placeholder: "A patient essayist in the tradition of Joan Didion", hint: "Who is speaking through the prose?" },
      task: { label: "The Piece", placeholder: "Write a 600-word personal essay on leaving a city you loved", hint: "The work to be written." },
      context: { label: "The Setting", placeholder: "For a personal Substack. Readers know me casually. Season is late autumn." },
      constraints: { label: "The Rules", placeholder: "600 words. Present tense. No em-dashes. Open on a sensory image." },
      examples: { label: "The Precedent", placeholder: "In the manner of 'Goodbye to All That' by Didion — restrained, elegiac." },
      outputFormat: { label: "The Form", placeholder: "Three sections separated by ornamental breaks. No headings." },
      tone: { label: "The Register", placeholder: "Wistful but unsentimental. Dry humor allowed once." },
      successCriteria: { label: "What It Must Do", placeholder: "The reader should finish and want to reread the opening." },
      negativeInstructions: { label: "What It Must Not", placeholder: "No clichés about seasons as metaphors. No neat resolution." },
    },
    presets: ["Personal essay", "Newsletter draft", "Speech opening", "Product description", "Cover letter"],
  },
  design: {
    id: "design",
    name: "Design",
    tagline: "make it feel!!",
    description: "Coral, cyan, blueprint grids. Loud, playful, opinionated.",
    icon: "◐",
    vibe: "Sketch a whole world, not a screen.",
    fieldLabels: {
      role: { label: "Who's designing?", placeholder: "Art director with a background in editorial + motion", hint: "The design sensibility to channel." },
      task: { label: "What are we making?", placeholder: "Landing page for a small-batch coffee roaster in Kyoto" },
      context: { label: "The brief", placeholder: "Brand is 3 years old, wants to feel handmade but confident. Audience 25–40." },
      constraints: { label: "Must-haves", placeholder: "Hero image, 3 product cards, subscription CTA, mobile-first" },
      examples: { label: "Reference vibe", placeholder: "Think Aesop meets a zine. Not Apple. Not Stripe." },
      outputFormat: { label: "Deliverable", placeholder: "Section-by-section wireframe with copy, color palette, and type pairing" },
      tone: { label: "Feeling", placeholder: "Quiet confidence. Warm neutrals. One loud accent." },
      successCriteria: { label: "Nailed it if…", placeholder: "It feels like a place, not a page." },
      negativeInstructions: { label: "Don't", placeholder: "No purple gradients. No generic 'trusted by' logos. No Inter." },
    },
    presets: ["Landing page brief", "Brand mood board", "Component redesign", "Poster concept", "Onboarding flow"],
  },
  debugging: {
    id: "debugging",
    name: "Debugging",
    tagline: "TRACE // ISOLATE // KILL",
    description: "Red on graphite. Stack traces, hypotheses, ruthless bisection.",
    icon: "✕",
    vibe: "Every bug has a reason. Find it. Prove it.",
    fieldLabels: {
      role: { label: "Investigator", placeholder: "Principal engineer diagnosing production incidents" },
      task: { label: "Bug Report", placeholder: "Users report 500s on checkout every ~40 requests, only on Safari iOS" },
      context: { label: "Evidence", placeholder: "Sentry trace shows null in `session.user`; started after deploy 2f4a1c" },
      constraints: { label: "Boundaries", placeholder: "Cannot deploy hotfix without RCA; must not roll back schema" },
      examples: { label: "Similar past bugs", placeholder: "Ref incident #1247 — cookie SameSite issue on Safari, resolved by explicit attr" },
      outputFormat: { label: "Report shape", placeholder: "Numbered hypotheses ranked by likelihood, with a verification step per hypothesis" },
      tone: { label: "Register", placeholder: "Forensic. State assumptions explicitly. No hand-waving." },
      successCriteria: { label: "Fixed when", placeholder: "Root cause identified with reproducible test; regression test added" },
      negativeInstructions: { label: "Do not", placeholder: "Do not suggest 'try turning it off and on'. No speculation without evidence." },
    },
    presets: ["Production incident", "Flaky test triage", "Memory leak hunt", "Race condition", "Performance regression"],
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "Strategy · Communication · Growth",
    description: "Navy, ivory, brushed gold. Boardroom-ready, quietly confident.",
    icon: "◆",
    vibe: "Every word costs a stakeholder's minute. Spend well.",
    fieldLabels: {
      role: { label: "Advisor", placeholder: "Fractional COO with SaaS operating experience", hint: "The professional lens." },
      task: { label: "Deliverable", placeholder: "Draft a board update for Q3 covering revenue, hiring, and product risk" },
      context: { label: "Situation", placeholder: "Series A SaaS, 22 people, $4M ARR, hiring frozen last month" },
      constraints: { label: "Requirements", placeholder: "Under 500 words. One page. Metrics table required. No hedging language." },
      examples: { label: "Precedent", placeholder: "Prior updates from Airbnb and Notion in their Series A era — direct, numbers-first" },
      outputFormat: { label: "Format", placeholder: "Headline · TL;DR · Metrics · Risks · Asks — in that order" },
      tone: { label: "Voice", placeholder: "Confident, calm, specific. Own bad news early." },
      successCriteria: { label: "Success looks like", placeholder: "Board members can skim in 90 seconds and know what to ask about." },
      negativeInstructions: { label: "Avoid", placeholder: "No jargon. No 'synergy', 'leverage', 'unlock'. No vanity metrics." },
    },
    presets: ["Board update", "Pitch deck outline", "Customer email", "Strategic memo", "Hiring rubric"],
  },
};

export const MODE_ORDER: ModeId[] = ["development", "writing", "design", "debugging", "business"];

export function assemblePrompt(fields: PromptFields, mode: ModeId): string {
  const m = MODES[mode];
  const parts: string[] = [];
  const line = (label: string, value: string) => {
    if (value.trim()) parts.push(`## ${label}\n${value.trim()}`);
  };
  parts.push(`# Prompt — ${m.name} mode\n`);
  line("Role", fields.role);
  line("Task", fields.task);
  line("Context", fields.context);
  line("Constraints", fields.constraints);
  line("Examples / References", fields.examples);
  line("Output Format", fields.outputFormat);
  line("Tone & Style", fields.tone);
  line("Success Criteria", fields.successCriteria);
  line("Do NOT", fields.negativeInstructions);
  return parts.join("\n\n");
}
