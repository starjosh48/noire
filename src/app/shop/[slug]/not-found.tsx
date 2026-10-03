import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProductNotFound() {
  return (
    <div className="shell">
      <EmptyState
        headingLevel="h1"
        title="This fragrance has evaporated"
        description="It may have been retired from the collection, or the link may be mistyped. The rest of the collection is still here."
        action={
          <>
            <ButtonLink href="/shop">Explore fragrances</ButtonLink>
            <ButtonLink href="/discovery" variant="secondary">
              Find your scent
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
