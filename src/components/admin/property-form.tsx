"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { savePropertyAction } from "@/app/actions/admin";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea, describedBy } from "@/components/ui/field";
import { Photo } from "@/components/ui/photo";
import { AMENITIES, CITIES, CITY_BY_SLUG, PROPERTY_TYPE_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatPrice, formatRupees } from "@/lib/format";
import { PROPERTY_STATUSES, PROPERTY_TYPES, type Agent, type CitySlug, type Property, type PropertyStatus, type PropertyType } from "@/lib/types";
import { fieldErrorsOf, idleState, propertySchema, type FieldErrors } from "@/lib/validation";
import { cn } from "@/lib/cn";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_BYTES = 8 * 1024 * 1024;

interface MediaItem {
  key: string;
  url: string;
  /** Alt text for photographs, label for floor plans. */
  text: string;
  uploading?: boolean;
  error?: string;
}

interface Values {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: string;
  city: CitySlug | "";
  locality: string;
  address: string;
  latitude: string;
  longitude: string;
  type: PropertyType | "";
  bedrooms: string;
  bathrooms: string;
  areaSqft: string;
  yearBuilt: string;
  parking: string;
  amenities: string[];
  status: PropertyStatus;
  featured: boolean;
  agentId: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

let keySeq = 0;
const nextKey = () => `m${++keySeq}`;

function initialValues(p?: Property): Values {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    tagline: p?.tagline ?? "",
    description: p?.description ?? "",
    price: p ? String(p.price) : "",
    city: p?.city ?? "",
    locality: p?.locality ?? "",
    address: p?.address ?? "",
    latitude: p ? String(p.latitude) : "",
    longitude: p ? String(p.longitude) : "",
    type: p?.type ?? "",
    bedrooms: p ? String(p.bedrooms) : "3",
    bathrooms: p ? String(p.bathrooms) : "3",
    areaSqft: p ? String(p.areaSqft) : "",
    yearBuilt: p?.yearBuilt ? String(p.yearBuilt) : "",
    parking: p ? String(p.parking) : "2",
    amenities: p?.amenities ?? [],
    status: p?.status ?? "available",
    featured: p?.featured ?? false,
    agentId: p?.agentId ?? "",
  };
}

/** Section with a label column on wide screens — keeps a long form calm and scannable. */
function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-8 border-t border-line py-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <div>
        <h2 className="text-[1.0625rem] font-medium">{title}</h2>
        {description ? <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function PropertyForm({ property, agents }: { property?: Property; agents: Agent[] }) {
  const id = useId();
  const router = useRouter();
  const { notify } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>(() => initialValues(property));
  const [slugTouched, setSlugTouched] = useState(Boolean(property));
  const [images, setImages] = useState<MediaItem[]>(() => (property?.images ?? []).map((i) => ({ key: nextKey(), url: i.url, text: i.alt })));
  const [plans, setPlans] = useState<MediaItem[]>(() => (property?.floorPlans ?? []).map((f) => ({ key: nextKey(), url: f.url, text: f.label })));
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [state, formAction, saving] = useActionState(savePropertyAction, idleState);
  const [, startTransition] = useTransition();

  const serverErrors = state.status === "error" ? state.fieldErrors : undefined;
  const errors: FieldErrors = clientErrors ?? serverErrors ?? {};
  const err = (key: string) => errors[key];
  const uploading = images.some((i) => i.uploading) || plans.some((p) => p.uploading);

  useEffect(() => {
    if (state.status === "success") {
      notify(state.message ?? "Saved.");
      router.push("/admin/properties");
      router.refresh();
    }
  }, [state, notify, router]);

  // Move focus to the first problem after a failed save.
  useEffect(() => {
    if (state.status === "error") {
      window.requestAnimationFrame(() => {
        const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]");
        (first ?? formRef.current?.querySelector<HTMLElement>("[role=alert]"))?.focus();
      });
    }
  }, [state]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (clientErrors?.[key]) setClientErrors((e) => (e ? { ...e, [key]: undefined } : e));
  };

  const payload = () => ({
    ...values,
    yearBuilt: values.yearBuilt.trim() === "" ? null : values.yearBuilt,
    agentId: values.agentId || null,
    city: values.city || undefined,
    type: values.type || undefined,
    images: images.filter((i) => !i.uploading && !i.error).map((i) => ({ url: i.url, alt: i.text })),
    floorPlans: plans.filter((p) => !p.uploading && !p.error).map((p) => ({ url: p.url, label: p.text })),
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploading) {
      notify("Please wait for uploads to finish.", { tone: "error" });
      return;
    }
    const data = payload();
    const parsed = propertySchema.safeParse(data);
    if (!parsed.success) {
      setClientErrors(fieldErrorsOf(parsed.error));
      window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    setClientErrors(null);
    const fd = new FormData();
    if (property) fd.set("id", property.id);
    fd.set("payload", JSON.stringify(data));
    startTransition(() => formAction(fd));
  };

  async function upload(files: FileList | null, kind: "image" | "plan") {
    if (!files?.length) return;
    const setList = kind === "image" ? setImages : setPlans;
    for (const file of Array.from(files).slice(0, 12)) {
      const key = nextKey();
      const label = kind === "image" ? "" : `Level ${plans.length + 1}`;
      if (!ACCEPT.split(",").includes(file.type) || file.size > MAX_BYTES) {
        notify(`${file.name}: use a JPEG, PNG, WebP or AVIF image up to 8 MB.`, { tone: "error" });
        continue;
      }
      setList((list) => [...list, { key, url: "", text: label, uploading: true }]);
      try {
        const body = new FormData();
        body.set("file", file);
        const res = await fetch("/api/admin/uploads", { method: "POST", body });
        const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed.");
        setList((list) => list.map((m) => (m.key === key ? { ...m, url: json.url!, uploading: false } : m)));
      } catch (error) {
        setList((list) => list.filter((m) => m.key !== key));
        notify(`${file.name}: ${(error as Error).message}`, { tone: "error" });
      }
    }
  }

  const priceNumber = Number(values.price);
  const city = values.city ? CITY_BY_SLUG[values.city] : null;
  const generalError = state.status === "error" && !clientErrors ? state.message : clientErrors ? "Please check the highlighted fields." : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="pb-28">
      {generalError ? (
        <div className="mb-10" tabIndex={-1}>
          <FormMessage tone="error">{generalError}</FormMessage>
        </div>
      ) : null}

      <Section title="Basics" description="How the residence is named and described across the site.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field id={`${id}-name`} label="Property name" error={err("name")}>
            <Input
              id={`${id}-name`}
              value={values.name}
              maxLength={120}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              {...describedBy(`${id}-name`, err("name"))}
            />
          </Field>
          <Field id={`${id}-slug`} label="Slug" error={err("slug")} hint={`estatex.in/properties/${values.slug || "…"}`}>
            <Input
              id={`${id}-slug`}
              value={values.slug}
              maxLength={80}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              }}
              onBlur={() => set("slug", slugify(values.slug))}
              {...describedBy(`${id}-slug`, err("slug"), true)}
            />
          </Field>
          <Field id={`${id}-tagline`} label="Tagline" optional error={err("tagline")} className="md:col-span-2" hint="One line shown under the name.">
            <Input id={`${id}-tagline`} value={values.tagline} maxLength={160} onChange={(e) => set("tagline", e.target.value)} {...describedBy(`${id}-tagline`, err("tagline"), true)} />
          </Field>
          <Field id={`${id}-description`} label="Description" error={err("description")} className="md:col-span-2" hint="Separate paragraphs with a blank line. The first paragraph is set large.">
            <Textarea
              id={`${id}-description`}
              rows={9}
              value={values.description}
              maxLength={6000}
              onChange={(e) => set("description", e.target.value)}
              {...describedBy(`${id}-description`, err("description"), true)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Location" description="Coordinates position the map marker and neighborhood view.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field id={`${id}-city`} label="City" error={err("city")}>
            <Select
              id={`${id}-city`}
              value={values.city}
              onChange={(e) => set("city", e.target.value as CitySlug)}
              {...describedBy(`${id}-city`, err("city"))}
            >
              <option value="" disabled>
                Choose a city
              </option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`${id}-locality`} label="Locality" error={err("locality")}>
            <Input id={`${id}-locality`} value={values.locality} maxLength={80} onChange={(e) => set("locality", e.target.value)} {...describedBy(`${id}-locality`, err("locality"))} />
          </Field>
          <Field id={`${id}-address`} label="Address" optional error={err("address")} className="md:col-span-2" hint="Shared with confirmed visitors only.">
            <Input id={`${id}-address`} value={values.address} maxLength={200} onChange={(e) => set("address", e.target.value)} {...describedBy(`${id}-address`, err("address"), true)} />
          </Field>
          <Field id={`${id}-lat`} label="Latitude" error={err("latitude")}>
            <Input id={`${id}-lat`} inputMode="decimal" value={values.latitude} onChange={(e) => set("latitude", e.target.value)} {...describedBy(`${id}-lat`, err("latitude"))} />
          </Field>
          <Field id={`${id}-lng`} label="Longitude" error={err("longitude")}>
            <Input id={`${id}-lng`} inputMode="decimal" value={values.longitude} onChange={(e) => set("longitude", e.target.value)} {...describedBy(`${id}-lng`, err("longitude"))} />
          </Field>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.8125rem] md:col-span-2">
            <button
              type="button"
              disabled={!city}
              onClick={() => {
                if (!city) return;
                set("latitude", String(city.center[0]));
                set("longitude", String(city.center[1]));
              }}
              className="min-h-11 underline underline-offset-4 disabled:no-underline disabled:opacity-50"
            >
              {city ? `Use the centre of ${city.name}` : "Choose a city to use its centre"}
            </button>
            {values.latitude && values.longitude ? (
              <a
                href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(values.latitude)}&mlon=${encodeURIComponent(values.longitude)}#map=15/${encodeURIComponent(values.latitude)}/${encodeURIComponent(values.longitude)}`}
                target="_blank"
                rel="noreferrer"
                className="min-h-11 py-3 text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Check on OpenStreetMap ↗
              </a>
            ) : null}
          </div>
        </div>
      </Section>

      <Section title="Details" description="Specifications shown on cards, the detail page and comparisons.">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <Field id={`${id}-type`} label="Property type" error={err("type")}>
            <Select id={`${id}-type`} value={values.type} onChange={(e) => set("type", e.target.value as PropertyType)} {...describedBy(`${id}-type`, err("type"))}>
              <option value="" disabled>
                Choose a type
              </option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            id={`${id}-price`}
            label="Price (₹)"
            error={err("price")}
            hint={priceNumber > 0 ? `${formatPrice(priceNumber)} · ${formatRupees(priceNumber)}` : "Whole rupees, e.g. 28000000 for ₹2.8 Cr"}
            className="xl:col-span-2"
          >
            <Input id={`${id}-price`} inputMode="numeric" value={values.price} onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))} {...describedBy(`${id}-price`, err("price"), true)} />
          </Field>
          {(
            [
              ["bedrooms", "Bedrooms"],
              ["bathrooms", "Bathrooms"],
              ["areaSqft", "Area (sq.ft.)"],
              ["parking", "Parking spaces"],
              ["yearBuilt", "Year built"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} id={`${id}-${key}`} label={label} optional={key === "yearBuilt"} error={err(key)}>
              <Input
                id={`${id}-${key}`}
                inputMode="numeric"
                value={values[key]}
                onChange={(e) => set(key, e.target.value.replace(/[^\d]/g, ""))}
                {...describedBy(`${id}-${key}`, err(key))}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Amenities" description={`${values.amenities.length} selected.`}>
        <fieldset>
          <legend className="sr-only">Amenities</legend>
          <div className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
            {AMENITIES.map((a) => (
              <label key={a.slug} className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem]">
                <input
                  type="checkbox"
                  className="ex-checkbox"
                  checked={values.amenities.includes(a.slug)}
                  onChange={(e) =>
                    set("amenities", e.target.checked ? [...values.amenities, a.slug] : values.amenities.filter((x) => x !== a.slug))
                  }
                />
                {a.label}
              </label>
            ))}
          </div>
          {err("amenities") ? <p className="mt-3 text-[0.8125rem] text-danger">{err("amenities")![0]}</p> : null}
        </fieldset>
      </Section>

      <Section title="Photographs" description="The first photograph is the cover. Describe each one for people using screen readers.">
        <MediaList
          items={images}
          kind="image"
          errors={errors}
          onChange={setImages}
          onUpload={(files) => upload(files, "image")}
        />
      </Section>

      <Section title="Floor plans" description="Optional. One image per level, labelled — e.g. Ground floor.">
        <MediaList items={plans} kind="plan" errors={errors} onChange={setPlans} onUpload={(files) => upload(files, "plan")} />
      </Section>

      <Section title="Publishing">
        <div className="grid gap-8 md:grid-cols-2">
          <fieldset className="md:col-span-2">
            <legend className="mb-3 text-[0.8125rem] font-medium">Status</legend>
            <div className="inline-flex border border-line">
              {PROPERTY_STATUSES.map((s) => (
                <label
                  key={s}
                  className={cn(
                    "relative flex min-h-11 cursor-pointer items-center px-5 text-[0.875rem] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent [&+&]:border-l [&+&]:border-line",
                    values.status === s ? "bg-ink text-ivory" : "hover:bg-ink/5",
                  )}
                >
                  <input type="radio" name="status" value={s} checked={values.status === s} onChange={() => set("status", s)} className="sr-only" />
                  {STATUS_LABELS[s]}
                </label>
              ))}
            </div>
          </fieldset>
          <Field id={`${id}-agent`} label="Advisor" optional error={err("agentId")}>
            <Select id={`${id}-agent`} value={values.agentId} onChange={(e) => set("agentId", e.target.value)} {...describedBy(`${id}-agent`, err("agentId"))}>
              <option value="">No advisor</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <label className="flex min-h-12 cursor-pointer items-center gap-3 text-[0.9375rem]">
              <input type="checkbox" className="ex-checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} />
              Feature on the homepage and at the top of the catalogue
            </label>
          </div>
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 backdrop-blur-md">
        <div className="container-site flex h-[4.5rem] items-center justify-between gap-4">
          <p className="hidden truncate text-[0.8125rem] text-muted sm:block" aria-live="polite">
            {uploading ? "Uploading images…" : property ? `Editing ${property.name}` : "New property"}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/admin/properties" className="inline-flex min-h-11 items-center px-3 text-[0.875rem] text-muted hover:text-ink">
              Cancel
            </Link>
            <Button type="submit" loading={saving} disabled={uploading}>
              {saving ? "Saving" : property ? "Save changes" : "Create property"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function MediaList({
  items,
  kind,
  errors,
  onChange,
  onUpload,
}: {
  items: MediaItem[];
  kind: "image" | "plan";
  errors: FieldErrors;
  onChange: (updater: (list: MediaItem[]) => MediaItem[]) => void;
  onUpload: (files: FileList | null) => void;
}) {
  const inputId = useId();
  const listKey = kind === "image" ? "images" : "floorPlans";
  const textKey = kind === "image" ? "alt" : "label";
  const move = (index: number, delta: number) =>
    onChange((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item!);
      return next;
    });

  return (
    <div>
      {items.length ? (
        <ol className="mb-6 border-t border-line">
          {items.map((item, i) => {
            const textError = errors[`${listKey}.${i}.${textKey}`] ?? errors[`${listKey}.${i}.url`];
            const textId = `${inputId}-${item.key}`;
            return (
              <li key={item.key} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 border-b border-line py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:items-center">
                <div className={cn("relative aspect-[4/3] overflow-hidden bg-sand", kind === "plan" && "bg-surface")}>
                  {item.uploading ? (
                    <span className="absolute inset-0 flex items-center justify-center text-muted">
                      <Loader2 aria-hidden className="size-5 animate-spin" strokeWidth={1.5} />
                      <span className="sr-only">Uploading</span>
                    </span>
                  ) : (
                    <Photo src={item.url} alt="" fill sizes="104px" className={kind === "plan" ? "object-contain p-1" : "object-cover"} />
                  )}
                  {kind === "image" && i === 0 && !item.uploading ? (
                    <span className="absolute left-0 top-0 bg-ink px-1.5 py-0.5 text-[0.625rem] uppercase tracking-wider text-ivory">Cover</span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <label htmlFor={textId} className="sr-only">
                    {kind === "image" ? `Description of photograph ${i + 1}` : `Label for floor plan ${i + 1}`}
                  </label>
                  <input
                    id={textId}
                    value={item.text}
                    maxLength={kind === "image" ? 200 : 60}
                    placeholder={kind === "image" ? "Describe the photograph (alt text)" : "e.g. Ground floor"}
                    onChange={(e) => onChange((list) => list.map((m) => (m.key === item.key ? { ...m, text: e.target.value } : m)))}
                    aria-invalid={textError ? true : undefined}
                    aria-describedby={textError ? `${textId}-error` : undefined}
                    className="h-11 w-full border border-line bg-surface px-3 text-[0.875rem] outline-none focus:border-accent aria-invalid:border-danger"
                  />
                  {textError ? (
                    <p id={`${textId}-error`} className="mt-1.5 text-[0.75rem] text-danger">
                      {textError[0]}
                    </p>
                  ) : null}
                </div>
                <div className="col-start-2 flex items-center gap-1 sm:col-start-3">
                  <IconButton label="Move up" disabled={i === 0 || item.uploading} onClick={() => move(i, -1)}>
                    <ArrowUp aria-hidden className="size-4" strokeWidth={1.5} />
                  </IconButton>
                  <IconButton label="Move down" disabled={i === items.length - 1 || item.uploading} onClick={() => move(i, 1)}>
                    <ArrowDown aria-hidden className="size-4" strokeWidth={1.5} />
                  </IconButton>
                  <IconButton label="Remove" onClick={() => onChange((list) => list.filter((m) => m.key !== item.key))} danger>
                    <Trash2 aria-hidden className="size-4" strokeWidth={1.5} />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      <label
        htmlFor={inputId}
        className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-ink/25 px-6 py-8 text-center transition-colors hover:border-ink has-[:focus-visible]:border-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onUpload(e.dataTransfer.files);
        }}
      >
        {kind === "image" ? <ImagePlus aria-hidden className="size-5 text-muted" strokeWidth={1.25} /> : <Upload aria-hidden className="size-5 text-muted" strokeWidth={1.25} />}
        <span className="text-[0.875rem]">{kind === "image" ? "Add photographs" : "Add floor plans"}</span>
        <span className="text-[0.75rem] text-muted">Drop files here or browse · JPEG, PNG, WebP or AVIF up to 8 MB</span>
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            onUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {errors[listKey] ? <p className="mt-3 text-[0.8125rem] text-danger" role="alert">{errors[listKey]![0]}</p> : null}
    </div>
  );
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 items-center justify-center transition-colors hover:bg-ink/5 disabled:opacity-30",
        danger && "hover:text-danger",
      )}
    >
      {children}
    </button>
  );
}
