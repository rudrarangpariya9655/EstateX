import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function PropertyNotFound() {
  return (
    <div className="container-site py-16 md:py-24">
      <EmptyState
        eyebrow="Residence not found"
        title="This home is no longer listed"
        body="It may have been withdrawn, or the link may be incorrect. The rest of the catalogue is a click away."
        action={
          <ButtonLink href="/properties" arrow>
            Explore properties
          </ButtonLink>
        }
      />
    </div>
  );
}
