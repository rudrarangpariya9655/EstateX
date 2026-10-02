/** Loading placeholder for dashboard and admin panels. */
export function PanelSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label}>
      <div className="mb-12 border-b border-line pb-8 md:mb-14">
        <div className="h-11 w-64 skeleton" />
        <div className="mt-4 h-4 w-full max-w-md skeleton" />
      </div>
      <div className="border-t border-line">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-5 border-b border-line py-5">
            <div className="size-16 shrink-0 skeleton" />
            <div className="flex-1">
              <div className="h-5 w-1/2 skeleton" />
              <div className="mt-2 h-3 w-1/3 skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
