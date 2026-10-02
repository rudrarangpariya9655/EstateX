import { describe, expect, it } from "vitest";
import { calculateEmi, validateEmiInput } from "@/lib/emi";
import { addDays, formatPrice, formatRupees, formatTimeSlot, todayInIndia } from "@/lib/format";

describe("calculateEmi", () => {
  it("matches the reducing-balance formula", () => {
    // ₹1 Cr loan at 8.5% over 20 years ≈ ₹86,782 per month.
    const r = calculateEmi({ price: 12_500_000, downPayment: 2_500_000, annualRatePercent: 8.5, years: 20 })!;
    expect(r.principal).toBe(10_000_000);
    expect(Math.round(r.monthlyPayment)).toBe(86782);
    expect(r.months).toBe(240);
    expect(r.totalPayable).toBeCloseTo(r.monthlyPayment * 240, 6);
  });

  it("handles a zero interest rate", () => {
    const r = calculateEmi({ price: 1_200_000, downPayment: 0, annualRatePercent: 0, years: 10 })!;
    expect(r.monthlyPayment).toBe(10_000);
    expect(r.totalInterest).toBe(0);
  });

  it("rejects invalid input", () => {
    const input = { price: 1_000_000, downPayment: 1_000_000, annualRatePercent: 25, years: 0 };
    expect(Object.keys(validateEmiInput(input)).sort()).toEqual(["annualRatePercent", "downPayment", "years"]);
    expect(calculateEmi(input)).toBeNull();
  });
});

describe("formatting", () => {
  it("formats Indian prices", () => {
    expect(formatPrice(28_000_000)).toBe("₹2.8 Cr");
    expect(formatPrice(8_500_000)).toBe("₹85 L");
    expect(formatRupees(28_000_000)).toBe("₹2,80,00,000");
  });

  it("formats time slots and dates", () => {
    expect(formatTimeSlot("14:30")).toBe("2:30 PM");
    expect(formatTimeSlot("10:00")).toBe("10:00 AM");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    // 20:00 UTC is already the next day in India (UTC+5:30).
    expect(todayInIndia(new Date("2026-10-01T20:00:00Z"))).toBe("2026-10-02");
  });
});
