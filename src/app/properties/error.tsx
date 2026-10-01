"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function PropertiesError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-site py-24">
      <EmptyState
        eyebrow="Something went wrong"
        title="We couldn't load properties"
        body="The catalogue is temporarily unavailable. Please try again in a moment."
        action={
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => retry()}>Try again</Button>
            <ButtonLink href="/" variant="outline">
              Back to home
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
