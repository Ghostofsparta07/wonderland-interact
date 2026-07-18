import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  MODES,
  MODE_ORDER,
  emptyPrompt,
  assemblePrompt,
  type ModeId,
  type PromptFields,
} from "@/lib/prompt-modes";

export const Route = createFileRoute("/")({
  component: Studio,
});

interface PromptVersion {
  fields: PromptFields;
  savedAt: number;
  note?: string;
}

interface SavedPrompt {
  id: string;
  name: string;
  mode: ModeId;
  fields: PromptFields;
  createdAt: number;
  updatedAt: number;
  versions: PromptVersion[];
}

const seedPrompt = (
  p: Omit<SavedPrompt, "updatedAt" | "versions"> & { versions?: PromptVersion[] },
): SavedPrompt => ({
  ...p,
  updatedAt: p.createdAt,
  versions: p.versions ?? [],
});

const SEED: SavedPrompt[] = [
  seedPrompt({
    id: "seed-1", mode: "development", name: "API Endpoint Designer",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    fields: {
      role: "Senior backend engineer, 10y in REST + GraphQL API design",
      task: "Design a paginated /orders endpoint with filtering and sorting",
      context: "Node 20, Fastify, PostgreSQL 15, existing user auth via JWT middleware",
      constraints: "Cursor-based pagination only; response < 200ms p95; must be OpenAPI-documentable",
      examples: "Follow the shape of GitHub's /repos/{owner}/{repo}/issues endpoint",
      outputFormat: "OpenAPI 3.1 YAML schema + example request/response",
      tone: "Precise, no filler. Assume the reader is a peer.",
      successCriteria: "A frontend engineer can implement the client without asking follow-up questions",
      negativeInstructions: "No offset pagination. No untyped `any`. Do not invent auth flows.",
    },
  }),
  seedPrompt({
    id: "seed-2", mode: "writing", name: "Founder Story Essay",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    fields: {
      role: "A memoirist with the restraint of Mary Oliver",
      task: "Write a 500-word founder origin story for a personal 'about' page",
      context: "Solo founder, second company, sold the first in 2021. Building in climate tech.",
      constraints: "500 words. First person. No bullet points. One concrete childhood memory.",
      examples: "In the register of Craig Mod's newsletter — quiet, specific, physical detail.",
      outputFormat: "Three short paragraphs, no headings.",
      tone: "Warm, unhurried, quietly ambitious.",
      successCriteria: "A reader trusts the founder within the first sentence.",
      negativeInstructions: "No 'ever since I was a kid…'. No LinkedIn cadence. No listing companies.",
    },
  }),
  seedPrompt({
    id: "seed-3", mode: "design", name: "SaaS Landing Rebrand",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    fields: {
      role: "Art director with a background in editorial magazines",
      task: "Rebrand landing page for a developer tool that formats SQL queries",
      context: "Existing brand is generic tech blue. Users are senior data engineers who value taste.",
      constraints: "Must include a live playground component; single hero CTA; dark mode required",
      examples: "Reference: Linear's restraint + Vercel's typography + a hint of Radix documentation",
      outputFormat: "Section list with layout notes, color tokens (hex), and font pairing",
      tone: "Quiet confidence. Editorial, not techy.",
      successCriteria: "Feels like a tool a principal engineer would put in their bookmarks bar.",
      negativeInstructions: "No purple gradient. No 3D blob. No 'AI-powered' in the hero.",
    },
  }),
  seedPrompt({
    id: "seed-4", mode: "debugging", name: "Intermittent 500 Triage",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    fields: {
      role: "Principal SRE running an incident review",
      task: "Diagnose intermittent 500 errors on POST /checkout appearing after deploy",
      context: "Rate ~1 in 60 requests, only Safari 17 iOS. Sentry shows null in session.user.id.",
      constraints: "No hotfix without root cause. Cannot roll back the schema migration.",
      examples: "Similar to incident #1247 (Safari SameSite=Lax cookie regression, 2024-08)",
      outputFormat: "Ranked hypothesis list; each hypothesis has: signal, test to run, expected outcome",
      tone: "Forensic. State assumptions before conclusions.",
      successCriteria: "Root cause identified with a reproducible failing test",
      negativeInstructions: "No speculation without a supporting log line. No 'have you tried restarting'.",
    },
  }),
  seedPrompt({
    id: "seed-5", mode: "business", name: "Q3 Board Update",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    fields: {
      role: "Fractional COO writing on behalf of the CEO",
      task: "Draft the Q3 board update email for a Series A SaaS company",
      context: "22 people, $4M ARR growing 8% MoM, hiring frozen last month, one key churn risk",
      constraints: "Under 500 words. One metrics table. Own the churn risk in the first paragraph.",
      examples: "In the register of early Notion investor updates — direct, numbers-first",
      outputFormat: "Headline · TL;DR (3 bullets) · Metrics table · Risks · Asks",
      tone: "Calm, specific, confident. Bad news first, framed with a plan.",
      successCriteria: "A board member can skim in 90 seconds and know exactly what to ask next.",
      negativeInstructions: "No 'synergy', 'leverage', 'unlock'. No vanity metrics. No hedging.",
    },
  }),
];

// Ensure prompts loaded from an older localStorage shape have the version fields.
const migrate = (list: SavedPrompt[]): SavedPrompt[] =>
  list.map((p) => ({
    ...p,
    updatedAt: p.updatedAt ?? p.createdAt,
    versions: p.versions ?? [],
  }));

function fieldsEqual(a: PromptFields, b: PromptFields) {
  return (Object.keys(a) as (keyof PromptFields)[]).every((k) => a[k] === b[k]);
}

function Studio() {
  const [mode, setMode] = useState<ModeId | null>(null);
  const [fields, setFields] = useState<PromptFields>(emptyPrompt);
  const [rawSaved, setSaved] = useLocalStorage<SavedPrompt[]>("promptsmith.saved.v1", SEED);
  const saved = useMemo(() => migrate(rawSaved), [rawSaved]);
  const [view, setView] = useState<"build" | "library">("build");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode ?? "default");
  }, [mode]);

  const loaded = loadedId ? saved.find((p) => p.id === loadedId) ?? null : null;
  const dirty = loaded ? !fieldsEqual(loaded.fields, fields) : false;

  const saveNew = (name: string) => {
    const now = Date.now();
    const p: SavedPrompt = {
      id: `p_${now}`,
      name: name || `${MODES[mode!].name} prompt`,
      mode: mode!,
      fields,
      createdAt: now,
      updatedAt: now,
      versions: [],
    };
    setSaved([p, ...saved]);
    setLoadedId(p.id);
  };

  const updateLoaded = () => {
    if (!loaded) return;
    const now = Date.now();
    setSaved(
      saved.map((p) =>
        p.id === loaded.id
          ? {
              ...p,
              fields,
              updatedAt: now,
              // Push the previous fields onto the history stack (newest first).
              versions: [{ fields: loaded.fields, savedAt: loaded.updatedAt }, ...p.versions].slice(0, 50),
            }
          : p,
      ),
    );
  };

  const restoreVersion = (promptId: string, versionIdx: number) => {
    const p = saved.find((x) => x.id === promptId);
    if (!p) return;
    const v = p.versions[versionIdx];
    if (!v) return;
    const now = Date.now();
    setSaved(
      saved.map((x) =>
        x.id === promptId
          ? {
              ...x,
              fields: v.fields,
              updatedAt: now,
              versions: [
                { fields: x.fields, savedAt: x.updatedAt, note: "before restore" },
                ...x.versions,
              ].slice(0, 50),
            }
          : x,
      ),
    );
    // Also load into the builder.
    setMode(p.mode);
    setFields(v.fields);
    setLoadedId(p.id);
    setView("build");
    setHistoryFor(null);
  };

  if (!mode) return <ModePicker onPick={(m) => { setMode(m); setLoadedId(null); setFields(emptyPrompt); }} />;

  return (
    <div className="min-h-screen relative">
      <div className="grain-overlay" />
      <Header
        mode={mode}
        onChangeMode={() => setMode(null)}
        view={view}
        setView={setView}
        savedCount={saved.length}
      />
      {view === "build" ? (
        <Builder
          mode={mode}
          fields={fields}
          setFields={setFields}
          loaded={loaded}
          dirty={dirty}
          onSaveNew={saveNew}
          onUpdate={updateLoaded}
          onNew={() => { setLoadedId(null); setFields(emptyPrompt); }}
          onOpenHistory={() => loaded && setHistoryFor(loaded.id)}
        />
      ) : (
        <Library
          saved={saved}
          onLoad={(p) => {
            setMode(p.mode);
            setFields(p.fields);
            setLoadedId(p.id);
            setView("build");
          }}
          onDelete={(id) => {
            setSaved(saved.filter((p) => p.id !== id));
            if (loadedId === id) setLoadedId(null);
          }}
          onHistory={(id) => setHistoryFor(id)}
        />
      )}
      {historyFor && (
        <HistoryModal
          prompt={saved.find((p) => p.id === historyFor)!}
          onClose={() => setHistoryFor(null)}
          onRestore={(idx) => restoreVersion(historyFor, idx)}
        />
      )}
    </div>
  );
}

/* ============================================================
   MODE PICKER
   ============================================================ */
function ModePicker({ onPick }: { onPick: (m: ModeId) => void }) {
  const [hover, setHover] = useState<ModeId | null>(null);

  return (
    <div data-mode={hover ?? "default"} className="mode-picker min-h-screen relative flex flex-col bg-background text-foreground transition-colors duration-500">
      <div className="grain-overlay" />
      <header className="px-6 md:px-12 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-mono-ui font-bold">P</div>
          <span className="font-mono-ui text-xs tracking-[0.2em] uppercase text-muted-foreground">
            promptsmith / v1.0
          </span>
        </div>
        <span className="font-mono-ui text-xs text-muted-foreground hidden md:block">
          five modes · nine fields · infinite prompts
        </span>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 md:px-12 py-16 max-w-7xl mx-auto w-full">
        <div className="mb-16 max-w-3xl">
          <p className="font-mono-ui text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
            A prompt engineering studio
          </p>
          <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight mb-6">
            Pick a mode.
            <br />
            <span className="italic text-primary">Change everything.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Five prompt-crafting environments, each with its own palette, typography,
            and rhythm. The canvas shifts to match the work.
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-5 gap-3"
          onMouseLeave={() => setHover(null)}
        >
          {MODE_ORDER.map((id, i) => {
            const m = MODES[id];
            const active = hover === id;
            return (
              <button
                key={id}
                onMouseEnter={() => setHover(id)}
                onFocus={() => setHover(id)}
                onClick={() => onPick(id)}
                className={`group text-left relative overflow-hidden rounded-lg border p-6 min-h-[280px] flex flex-col justify-between transition-[border-color,box-shadow,background-color] duration-300 ${
                  active
                    ? "border-primary bg-surface shadow-2xl"
                    : "border-border bg-surface/50 hover:border-primary/50"
                }`}
              >
                <div>
                  <div className="text-4xl mb-4 text-primary">{m.icon}</div>
                  <div className="font-mono-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                    0{i + 1} · {m.tagline}
                  </div>
                  <h2 className="font-display text-2xl mb-2">{m.name}</h2>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {m.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs font-mono-ui text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>ENTER</span>
                  <span className="w-6 h-px bg-primary" />
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-12 font-mono-ui text-xs text-muted-foreground text-center">
          hover to preview · click to enter
        </p>
      </main>
    </div>
  );
}

/* ============================================================
   HEADER
   ============================================================ */
function Header({
  mode, onChangeMode, view, setView, savedCount,
}: {
  mode: ModeId;
  onChangeMode: () => void;
  view: "build" | "library";
  setView: (v: "build" | "library") => void;
  savedCount: number;
}) {
  const m = MODES[mode];
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <button
          onClick={onChangeMode}
          className="flex items-center gap-3 group"
          aria-label="Change mode"
        >
          <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground grid place-items-center text-lg">
            {m.icon}
          </div>
          <div className="text-left">
            <div className="font-mono-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              mode · click to change
            </div>
            <div className="font-display text-lg leading-none mt-0.5">{m.name}</div>
          </div>
        </button>

        <nav className="flex items-center gap-1 p-1 rounded-full border border-border bg-surface">
          {(["build", "library"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-sm font-mono-ui uppercase tracking-wider transition-colors ${
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v} {v === "library" && <span className="opacity-70">({savedCount})</span>}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ============================================================
   BUILDER
   ============================================================ */
function Builder({
  mode, fields, setFields, loaded, dirty, onSaveNew, onUpdate, onNew, onOpenHistory,
}: {
  mode: ModeId;
  fields: PromptFields;
  setFields: (f: PromptFields) => void;
  loaded: SavedPrompt | null;
  dirty: boolean;
  onSaveNew: (name: string) => void;
  onUpdate: () => void;
  onNew: () => void;
  onOpenHistory: () => void;
}) {
  const m = MODES[mode];
  const [saveName, setSaveName] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const assembled = useMemo(() => assemblePrompt(fields, mode), [fields, mode]);
  const wordCount = assembled.trim().split(/\s+/).filter(Boolean).length;
  const completed = Object.values(fields).filter((v) => v.trim()).length;

  const copy = async () => {
    await navigator.clipboard.writeText(assembled);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const flashSaved = () => {
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
      {/* Mode intro */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-ui text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
            {m.tagline}
          </p>
          <h1 className="font-display text-4xl md:text-5xl leading-none">
            {m.vibe}
          </h1>
          {loaded && (
            <div className="mt-3 flex items-center gap-2 font-mono-ui text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              editing <span className="text-foreground">{loaded.name}</span>
              <span className="opacity-60">· {loaded.versions.length} prior version{loaded.versions.length === 1 ? "" : "s"}</span>
              {dirty && <span className="text-accent">· unsaved changes</span>}
              <button onClick={onNew} className="ml-2 underline hover:text-primary">start new</button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {m.presets.map((p) => (
            <button
              key={p}
              onClick={() => setFields({ ...fields, task: p })}
              className="text-xs font-mono-ui px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        {/* Fields column */}
        <section className="space-y-3">
          <FieldRow k="role" mode={mode} fields={fields} setFields={setFields} />
          <FieldRow k="task" mode={mode} fields={fields} setFields={setFields} textarea />
          <FieldRow k="context" mode={mode} fields={fields} setFields={setFields} textarea />
          <FieldRow k="constraints" mode={mode} fields={fields} setFields={setFields} textarea />
          <FieldRow k="examples" mode={mode} fields={fields} setFields={setFields} textarea />
          <FieldRow k="outputFormat" mode={mode} fields={fields} setFields={setFields} />
          <FieldRow k="tone" mode={mode} fields={fields} setFields={setFields} />
          <FieldRow k="successCriteria" mode={mode} fields={fields} setFields={setFields} textarea />
          <FieldRow k="negativeInstructions" mode={mode} fields={fields} setFields={setFields} textarea />
        </section>

        {/* Preview column */}
        <section className="lg:sticky lg:top-24 self-start">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
                </div>
                <span className="font-mono-ui text-xs text-muted-foreground">
                  prompt.md · {wordCount} words · {completed}/9 fields
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copy}
                  className="text-xs font-mono-ui uppercase tracking-wider px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {copied ? "✓ copied" : "copy"}
                </button>
                <button
                  onClick={() => setFields(emptyPrompt)}
                  className="text-xs font-mono-ui uppercase tracking-wider px-3 py-1.5 rounded-md border border-border hover:border-primary transition-colors"
                >
                  clear
                </button>
              </div>
            </div>
            <pre className="p-5 max-h-[65vh] overflow-auto text-sm font-mono-ui whitespace-pre-wrap leading-relaxed text-foreground">
              {assembled.trim() || (
                <span className="text-muted-foreground italic">
                  Start filling fields on the left. Your assembled prompt appears here in real time.
                </span>
              )}
            </pre>
            <div className="px-4 py-3 border-t border-border bg-surface flex items-center gap-2 flex-wrap">
              {loaded ? (
                <>
                  <button
                    onClick={() => { onUpdate(); flashSaved(); }}
                    disabled={!dirty}
                    className="text-xs font-mono-ui uppercase tracking-wider px-3 py-1.5 rounded-md bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90"
                  >
                    {justSaved ? "✓ new version" : "save version"}
                  </button>
                  <button
                    onClick={onOpenHistory}
                    className="text-xs font-mono-ui uppercase tracking-wider px-3 py-1.5 rounded-md border border-border hover:border-primary transition-colors"
                  >
                    history ({loaded.versions.length})
                  </button>
                  <button
                    onClick={() => setShowSaveInput(true)}
                    className="text-xs font-mono-ui uppercase tracking-wider px-3 py-1.5 rounded-md border border-border hover:border-primary transition-colors"
                  >
                    save as new
                  </button>
                </>
              ) : showSaveInput ? (
                <>
                  <input
                    autoFocus
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Name this prompt…"
                    className="flex-1 min-w-[160px] bg-transparent outline-none text-sm font-mono-ui placeholder:text-muted-foreground border-b border-border focus:border-primary py-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onSaveNew(saveName);
                        setSaveName("");
                        setShowSaveInput(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      onSaveNew(saveName);
                      setSaveName("");
                      setShowSaveInput(false);
                    }}
                    className="text-xs font-mono-ui uppercase px-3 py-1.5 rounded-md bg-accent text-accent-foreground"
                  >
                    save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowSaveInput(true)}
                  disabled={completed === 0}
                  className="text-xs font-mono-ui uppercase tracking-wider px-3 py-1.5 rounded-md border border-border hover:border-primary transition-colors disabled:opacity-40 disabled:hover:border-border"
                >
                  + save to library
                </button>
              )}
              {showSaveInput && loaded && (
                <>
                  <input
                    autoFocus
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Name the new prompt…"
                    className="flex-1 min-w-[160px] bg-transparent outline-none text-sm font-mono-ui placeholder:text-muted-foreground border-b border-border focus:border-primary py-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onSaveNew(saveName);
                        setSaveName("");
                        setShowSaveInput(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      onSaveNew(saveName);
                      setSaveName("");
                      setShowSaveInput(false);
                    }}
                    className="text-xs font-mono-ui uppercase px-3 py-1.5 rounded-md bg-accent text-accent-foreground"
                  >
                    save copy
                  </button>
                </>
              )}
              <div className="ml-auto h-1 flex-1 max-w-[200px] bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(completed / 9) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FieldRow({
  k, mode, fields, setFields, textarea,
}: {
  k: keyof PromptFields;
  mode: ModeId;
  fields: PromptFields;
  setFields: (f: PromptFields) => void;
  textarea?: boolean;
}) {
  const meta = MODES[mode].fieldLabels[k];
  const value = fields[k];
  const filled = value.trim().length > 0;
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textarea && ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value, textarea]);

  return (
    <div
      className={`group rounded-lg border transition-all p-4 ${
        filled ? "border-primary/50 bg-card" : "border-border bg-card/50 hover:border-primary/30"
      }`}
    >
      <label className="flex items-baseline justify-between mb-2 gap-2">
        <span className="font-mono-ui text-[11px] tracking-[0.15em] uppercase text-primary">
          {meta.label}
        </span>
        {meta.hint && (
          <span className="text-[10px] text-muted-foreground italic hidden md:block truncate max-w-[60%]">
            {meta.hint}
          </span>
        )}
      </label>
      {textarea ? (
        <textarea
          ref={ref}
          rows={2}
          value={value}
          onChange={(e) => setFields({ ...fields, [k]: e.target.value })}
          placeholder={meta.placeholder}
          className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground/60"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => setFields({ ...fields, [k]: e.target.value })}
          placeholder={meta.placeholder}
          className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
        />
      )}
    </div>
  );
}

/* ============================================================
   LIBRARY
   ============================================================ */
function Library({
  saved, onLoad, onDelete, onHistory,
}: {
  saved: SavedPrompt[];
  onLoad: (p: SavedPrompt) => void;
  onDelete: (id: string) => void;
  onHistory: (id: string) => void;
}) {
  return (
    <main className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="mb-8">
        <p className="font-mono-ui text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
          library · {saved.length} prompts
        </p>
        <h1 className="font-display text-4xl md:text-5xl">Your saved prompts.</h1>
      </div>
      {saved.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center text-muted-foreground">
          Nothing saved yet. Build a prompt and hit save.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((p) => {
            const m = MODES[p.mode];
            const preview = assemblePrompt(p.fields, p.mode).slice(0, 220);
            return (
              <article
                key={p.id}
                className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <span className="text-lg leading-none">{m.icon}</span>
                    {m.name}
                  </span>
                  <span className="font-mono-ui text-[10px] text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-display text-xl leading-tight">{p.name}</h3>
                <p className="text-xs text-muted-foreground font-mono-ui line-clamp-4 leading-relaxed">
                  {preview}…
                </p>
                <div className="font-mono-ui text-[10px] text-muted-foreground">
                  {p.versions.length} prior version{p.versions.length === 1 ? "" : "s"}
                </div>
                <div className="flex gap-2 mt-auto pt-2 flex-wrap">
                  <button
                    onClick={() => onLoad(p)}
                    className="flex-1 text-xs font-mono-ui uppercase tracking-wider px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
                  >
                    open
                  </button>
                  <button
                    onClick={() => onHistory(p.id)}
                    disabled={p.versions.length === 0}
                    className="text-xs font-mono-ui uppercase tracking-wider px-3 py-2 rounded-md border border-border hover:border-primary disabled:opacity-40"
                  >
                    history
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-xs font-mono-ui uppercase tracking-wider px-3 py-2 rounded-md border border-border hover:border-destructive hover:text-destructive"
                  >
                    delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

/* ============================================================
   HISTORY MODAL
   ============================================================ */
function HistoryModal({
  prompt, onClose, onRestore,
}: {
  prompt: SavedPrompt;
  onClose: () => void;
  onRestore: (versionIdx: number) => void;
}) {
  const [selected, setSelected] = useState<number>(0);
  const m = MODES[prompt.mode];
  const entries = [
    { label: "current", savedAt: prompt.updatedAt, fields: prompt.fields, isCurrent: true },
    ...prompt.versions.map((v, i) => ({
      label: `version ${prompt.versions.length - i}`,
      savedAt: v.savedAt,
      fields: v.fields,
      isCurrent: false,
      note: v.note,
      idx: i,
    })),
  ];
  const active = entries[selected];
  const activePreview = assemblePrompt(active.fields, prompt.mode);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[85vh] rounded-lg border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <span>{m.icon}</span> version history
            </p>
            <h2 className="font-display text-2xl mt-1">{prompt.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="font-mono-ui text-xs uppercase px-3 py-1.5 rounded-md border border-border hover:border-primary"
          >
            close
          </button>
        </div>

        <div className="grid md:grid-cols-[240px_1fr] flex-1 min-h-0">
          <aside className="border-r border-border overflow-y-auto">
            {entries.map((e, i) => {
              const activeCls = i === selected ? "bg-surface border-l-primary" : "border-l-transparent hover:bg-surface/50";
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left px-4 py-3 border-b border-border border-l-2 transition-colors ${activeCls}`}
                >
                  <div className="font-mono-ui text-[11px] uppercase tracking-wider text-foreground flex items-center gap-2">
                    {e.label}
                    {e.isCurrent && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                        live
                      </span>
                    )}
                  </div>
                  <div className="font-mono-ui text-[10px] text-muted-foreground mt-1">
                    {new Date(e.savedAt).toLocaleString()}
                  </div>
                </button>
              );
            })}
            {prompt.versions.length === 0 && (
              <div className="px-4 py-6 font-mono-ui text-[11px] text-muted-foreground">
                No prior versions yet. Update this prompt to start building history.
              </div>
            )}
          </aside>

          <div className="flex flex-col min-h-0">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-surface">
              <span className="font-mono-ui text-xs text-muted-foreground">
                {active.isCurrent ? "current fields" : "preview of this version"}
              </span>
              {!active.isCurrent && "idx" in active && (
                <button
                  onClick={() => onRestore(active.idx as number)}
                  className="font-mono-ui text-xs uppercase tracking-wider px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90"
                >
                  restore this version
                </button>
              )}
            </div>
            <pre className="p-5 overflow-auto text-sm font-mono-ui whitespace-pre-wrap leading-relaxed flex-1">
              {activePreview.trim() || (
                <span className="text-muted-foreground italic">Empty prompt.</span>
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
