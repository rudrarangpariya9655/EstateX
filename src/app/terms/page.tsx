import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { DEMO_NOTICE } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms",
  description: "Terms of use for the EstateX demonstration.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="1 October 2026"
      intro={<p>{DEMO_NOTICE}</p>}
      sections={[
        {
          heading: "No offer or advice",
          body: <p>Nothing on EstateX is an offer to sell, a valuation or financial advice. Residences, prices, agents and neighborhood information are illustrative.</p>,
        },
        {
          heading: "Estimates",
          body: <p>The EMI calculator and distances are estimates for illustration only. Actual figures depend on lenders, terms and conditions on the ground.</p>,
        },
        {
          heading: "Visit requests",
          body: <p>Submitting a visit request records your preference. A visit is only arranged once an advisor confirms it with you.</p>,
        },
        {
          heading: "Photography",
          body: <p>Demonstration photography is sourced from Unsplash and is used to illustrate the product. It does not depict the fictional residences described.</p>,
        },
      ]}
    />
  );
}
