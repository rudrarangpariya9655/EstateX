import type { ReactNode } from "react";

/** Plain, readable long-form layout for legal pages. */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: ReactNode; sections: { heading: string; body: ReactNode }[] }) {
  return (
    <article className="container-site grid gap-14 pb-32 pt-14 md:pb-44 md:pt-20 lg:grid-cols-12 lg:gap-10">
      <header className="lg:col-span-4">
        <div className="lg:sticky lg:top-32">
          <p className="hero-fade eyebrow text-muted">Last updated {updated}</p>
          <h1 className="hero-fade mt-6 text-h2" style={{ animationDelay: "80ms" }}>
            {title}
          </h1>
        </div>
      </header>
      <div className="hero-fade max-w-[42rem] lg:col-span-7 lg:col-start-6" style={{ animationDelay: "160ms" }}>
        <div className="text-lead text-ink-soft">{intro}</div>
        {sections.map((s) => (
          <section key={s.heading} className="mt-14 border-t border-line pt-8">
            <h2 className="font-serif text-[1.75rem] leading-tight">{s.heading}</h2>
            <div className="mt-5 flex flex-col gap-4 text-[1rem] leading-[1.75] text-ink-soft">{s.body}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
