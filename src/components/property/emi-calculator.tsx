"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, describedBy } from "@/components/ui/field";
import { calculateEmi, validateEmiInput, type EmiInput } from "@/lib/emi";
import { formatPrice, formatRupees } from "@/lib/format";

const DEFAULTS = { downPercent: 20, rate: 8.5, years: 20 };
const TERMS = [5, 10, 15, 20, 25, 30];

export function EmiCalculator({ price }: { price: number }) {
  const id = useId();
  const [priceText, setPriceText] = useState(String(price));
  const [downPercent, setDownPercent] = useState(DEFAULTS.downPercent);
  const [rateText, setRateText] = useState(String(DEFAULTS.rate));
  const [years, setYears] = useState(DEFAULTS.years);

  const input: EmiInput = useMemo(() => {
    const p = Number(priceText);
    return {
      price: p,
      downPayment: Math.round((p * downPercent) / 100),
      annualRatePercent: Number(rateText),
      years,
    };
  }, [priceText, downPercent, rateText, years]);

  const errors = validateEmiInput(input);
  const result = calculateEmi(input);
  const interestShare = result ? result.totalInterest / result.totalPayable : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={`${id}-price`} label="Property price (₹)" error={errors.price} hint={Number.isFinite(input.price) ? formatPrice(input.price) : undefined}>
          <Input
            id={`${id}-price`}
            type="number"
            inputMode="numeric"
            min={500000}
            step={100000}
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            {...describedBy(`${id}-price`, errors.price, true)}
          />
        </Field>
        <Field id={`${id}-rate`} label="Interest rate (% per year)" error={errors.annualRatePercent}>
          <Input
            id={`${id}-rate`}
            type="number"
            inputMode="decimal"
            min={0}
            max={20}
            step={0.05}
            value={rateText}
            onChange={(e) => setRateText(e.target.value)}
            {...describedBy(`${id}-rate`, errors.annualRatePercent)}
          />
        </Field>
        <Field
          id={`${id}-down`}
          label={
            <span>
              Down payment <span className="font-normal text-muted">· {downPercent}%</span>
            </span>
          }
          error={errors.downPayment}
          hint={Number.isFinite(input.downPayment) ? formatRupees(input.downPayment) : undefined}
          className="sm:col-span-2"
        >
          <input
            id={`${id}-down`}
            type="range"
            min={0}
            max={90}
            step={5}
            value={downPercent}
            onChange={(e) => setDownPercent(Number(e.target.value))}
            aria-valuetext={`${downPercent}% — ${formatRupees(input.downPayment)}`}
            className="h-11 w-full cursor-pointer accent-[var(--color-accent)]"
            {...describedBy(`${id}-down`, errors.downPayment, true)}
          />
        </Field>
        <Field id={`${id}-term`} label="Loan term" error={errors.years} className="sm:col-span-2">
          <Select id={`${id}-term`} value={years} onChange={(e) => setYears(Number(e.target.value))}>
            {TERMS.map((t) => (
              <option key={t} value={t}>
                {t} years
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="border-t border-line pt-8" aria-live="polite">
        <p className="eyebrow text-muted">Estimated monthly payment</p>
        {result ? (
          <>
            <p className="mt-3 font-serif text-[3rem] leading-none tabular-nums">{formatRupees(result.monthlyPayment)}</p>
            <div className="mt-6 flex h-1.5 w-full overflow-hidden bg-line" aria-hidden>
              <span className="bg-ink" style={{ width: `${(1 - interestShare) * 100}%` }} />
              <span className="bg-accent/60" style={{ width: `${interestShare * 100}%` }} />
            </div>
            <dl className="mt-5 grid grid-cols-1 gap-3 text-[0.875rem] sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-2 text-muted">
                  <span aria-hidden className="size-2 bg-ink" /> Loan amount
                </dt>
                <dd className="mt-1 tabular-nums">{formatRupees(result.principal)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-muted">
                  <span aria-hidden className="size-2 bg-accent/60" /> Total interest
                </dt>
                <dd className="mt-1 tabular-nums">{formatRupees(result.totalInterest)}</dd>
              </div>
              <div>
                <dt className="text-muted">Total payable</dt>
                <dd className="mt-1 tabular-nums">{formatRupees(result.totalPayable)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="mt-3 text-[0.9375rem] text-muted">Adjust the values above to see an estimate.</p>
        )}
      </div>

      <p className="border-l-2 border-line pl-4 text-[0.8125rem] leading-relaxed text-muted">
        This is an estimate for illustration only, using a standard reducing-balance formula. Actual EMIs depend on
        the lender, your eligibility, fees, taxes and the final loan terms.
      </p>
    </div>
  );
}

/** Compact teaser in the summary column; the full calculator opens in a drawer. */
export function EmiTeaser({ price }: { price: number }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const estimate = calculateEmi({
    price,
    downPayment: Math.round((price * DEFAULTS.downPercent) / 100),
    annualRatePercent: DEFAULTS.rate,
    years: DEFAULTS.years,
  });
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="group flex w-full items-center justify-between gap-4 border-y border-line py-5 text-left"
      >
        <span>
          <span className="block eyebrow text-muted">Estimated EMI</span>
          <span className="mt-2 block text-[0.9375rem]">
            {estimate ? (
              <>
                from <span className="font-medium tabular-nums">{formatRupees(estimate.monthlyPayment)}</span> / month
              </>
            ) : (
              "Calculate your monthly payment"
            )}
          </span>
        </span>
        <span className="inline-flex items-center gap-2 label-caps text-[0.68rem] transition-opacity group-hover:opacity-70">
          <Calculator aria-hidden className="size-4" strokeWidth={1.4} /> Calculate
        </span>
      </button>
      <Dialog
        open={open}
        onClose={close}
        title="EMI calculator"
        description={`Indicative only · assumes ${DEFAULTS.downPercent}% down, ${DEFAULTS.rate}% for ${DEFAULTS.years} years to start.`}
        variant="drawer"
      >
        <EmiCalculator price={price} />
      </Dialog>
    </>
  );
}
