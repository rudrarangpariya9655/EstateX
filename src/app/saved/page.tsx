import type { Metadata } from "next";
import { SavedCollection, SavedCount } from "@/components/saved/saved-collection";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Saved homes",
  description: "The residences you've saved on EstateX.",
  path: "/saved",
  noIndex: true,
});

export default function SavedPage() {
  return (
    <div className="container-site pb-32 pt-14 md:pb-44 md:pt-20">
      <header className="mb-16 grid gap-8 md:mb-24 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="hero-fade eyebrow text-muted">Your collection</p>
          <h1 className="hero-fade mt-6 text-h1" style={{ animationDelay: "80ms" }}>
            Saved homes
          </h1>
        </div>
        <p className="hero-fade text-[0.9375rem] text-muted lg:col-span-4 lg:col-start-9 lg:pb-3 lg:text-right" style={{ animationDelay: "160ms" }}>
          <SavedCount />
        </p>
      </header>
      <SavedCollection />
    </div>
  );
}
