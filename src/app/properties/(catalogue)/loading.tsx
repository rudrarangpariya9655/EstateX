import { PropertyCardSkeleton } from "@/components/property/property-card";

export default function LoadingProperties() {
  return (
    <div aria-busy="true" aria-label="Loading properties">
      <div className="container-site pb-14 pt-14 md:pb-20 md:pt-20">
        <div className="h-3 w-28 skeleton" />
        <div className="mt-6 h-16 w-72 skeleton md:h-24 md:w-96" />
        <div className="mt-6 h-5 w-full max-w-md skeleton" />
      </div>
      <div className="h-[4.25rem] border-y border-line" />
      <div className="container-site pb-32 pt-12">
        <div className="mb-16 h-4 w-48 skeleton" />
        <div className="grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
