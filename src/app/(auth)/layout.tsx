import { Photo } from "@/components/ui/photo";
import { blurFor } from "@/lib/blur";
import { unsplash } from "@/lib/images";

const IMAGE = {
  url: unsplash("1600607687939-ce8a6c25118c"),
  alt: "A calm living room with linen sofas and tall windows opening onto a garden",
};

/** Minimal split layout shared by sign-in, sign-up and password recovery. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:min-h-[calc(100dvh-5.5rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sand lg:block">
        <Photo
          src={IMAGE.url}
          alt={IMAGE.alt}
          blurDataUrl={blurFor(IMAGE.url)}
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
        <p className="absolute bottom-12 left-12 max-w-sm font-serif text-[2.25rem] leading-[1.05] text-white xl:bottom-16 xl:left-16">
          Every search begins with a single home that feels right.
        </p>
      </div>
      <div className="container-site flex items-center py-16 md:py-24 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-[26rem] lg:mx-0">{children}</div>
      </div>
    </div>
  );
}
