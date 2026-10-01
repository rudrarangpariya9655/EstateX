import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { HeroLines } from "@/components/motion/reveal";
import { CITIES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Tell us how you want to live. An EstateX advisor will reply with a short list — not a long one.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container-site grid gap-20 pb-32 pt-14 md:pb-44 md:pt-20 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-5">
        <p className="hero-fade eyebrow text-muted">Contact</p>
        <HeroLines lines={["Let’s find", "your next", <em key="a">address.</em>]} className="mt-6 text-h1" />
        <p className="hero-fade mt-10 max-w-sm text-lead text-muted" style={{ animationDelay: "500ms" }}>
          Tell us where and how you want to live. An advisor who knows the city will come back to you personally.
        </p>
        <dl className="hero-fade mt-16 grid max-w-sm gap-8 border-t border-line pt-10" style={{ animationDelay: "650ms" }}>
          <div>
            <dt className="eyebrow text-muted">Advisors in</dt>
            <dd className="mt-3 text-[0.9375rem] leading-relaxed">{CITIES.map((c) => c.name).join(" · ")}</dd>
          </div>
          <div>
            <dt className="eyebrow text-muted">Response</dt>
            <dd className="mt-3 text-[0.9375rem] leading-relaxed">Usually within two working days.</dd>
          </div>
        </dl>
      </div>
      <div className="hero-fade lg:col-span-6 lg:col-start-7 lg:pt-4" style={{ animationDelay: "300ms" }}>
        <InquiryForm topic="general" />
      </div>
    </div>
  );
}
