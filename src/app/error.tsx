"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-site grid min-h-[70dvh] content-center gap-12 py-24 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        <p className="eyebrow text-muted">Something went wrong</p>
        <h1 className="mt-6 text-h1">
          We couldn&apos;t load
          <br />
          <em>this page.</em>
        </h1>
      </div>
      <div className="flex flex-col items-start gap-8 lg:col-span-4 lg:pb-4">
        <p className="max-w-sm text-[1rem] leading-relaxed text-muted">
          It&apos;s probably temporary. Try again, and if it keeps happening, come back in a few minutes.
          {error.digest ? <span className="mt-3 block text-[0.75rem]">Reference: {error.digest}</span> : null}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => retry()}>Try again</Button>
          <ButtonLink href="/" variant="outline">
            Home
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
