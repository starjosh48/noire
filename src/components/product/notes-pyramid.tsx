const tiers = [
  { key: "top", title: "Top notes", timing: "The first impression · 0–15 minutes" },
  { key: "heart", title: "Heart notes", timing: "The character · 15 minutes – 3 hours" },
  { key: "base", title: "Base notes", timing: "What lingers · 3 hours and beyond" },
] as const;

export function NotesPyramid({ top, heart, base }: { top: string[]; heart: string[]; base: string[] }) {
  const notes = { top, heart, base };
  return (
    <div className="grid gap-px bg-line md:grid-cols-3">
      {tiers.map((tier, index) => (
        <section key={tier.key} aria-labelledby={`notes-${tier.key}`} className="bg-ivory p-6 md:p-8">
          <div className="flex items-baseline justify-between">
            <h3 id={`notes-${tier.key}`} className="display text-[30px]">
              {tier.title}
            </h3>
            <span className="text-[12px] tabular-nums text-faint">{String(index + 1).padStart(2, "0")}</span>
          </div>
          <p className="mt-1 text-[12px] text-muted">{tier.timing}</p>
          <ul className="mt-6 flex flex-col gap-2">
            {notes[tier.key].map((note) => (
              <li key={note} className="text-[16px] text-ink">
                {note}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
