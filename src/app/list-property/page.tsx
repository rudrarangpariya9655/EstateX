import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { HeroLines } from "@/components/motion/reveal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "List your property",
  description: "Represent a distinctive home with EstateX. Tell us about your property and an advisor will be in touch.",
  path: "/list-property",
});

const STEPS = [
  { title: "Tell us about it", body: "A few details are enough to begin — where it is, what it is and what makes it special." },
  { title: "We visit", body: "An advisor walks the home with you, looking at light, materials, setting and condition." },
  { title: "We decide together", body: "If it is right for EstateX, we photograph, write and present it with care. If not, we say so." },
];

export default function ListPropertyPage() {
  return (
    <div className="container-site grid gap-20 pb-32 pt-14 md:pb-44 md:pt-20 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-5">
        <p className="hero-fade eyebrow text-muted">List with EstateX</p>
        <HeroLines lines={["A home worth", <em key="a">presenting well.</em>]} className="mt-6 text-h1" />
        <p className="hero-fade mt-10 max-w-sm text-lead text-muted" style={{ animationDelay: "450ms" }}>
          We represent a small number of homes, chosen for their architecture and setting — and give each one the attention it deserves.
        </p>
        <ol className="hero-fade mt-16 max-w-md" style={{ animationDelay: "600ms" }}>
          {STEPS.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-line py-7 last:border-b">
              <span className="pt-0.5 text-[0.8125rem] tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="font-serif text-[1.5rem] leading-tight">{step.title}</h2>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="hero-fade lg:col-span-6 lg:col-start-7 lg:pt-4" style={{ animationDelay: "300ms" }}>
        <InquiryForm topic="listing" />
      </div>
    </div>
  );
}
