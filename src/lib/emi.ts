export interface EmiInput {
  price: number;
  downPayment: number;
  annualRatePercent: number;
  years: number;
}

export interface EmiResult {
  principal: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayable: number;
  months: number;
}

export const EMI_LIMITS = {
  minPrice: 500_000,
  maxPrice: 5_000_000_000,
  minRate: 0,
  maxRate: 20,
  minYears: 1,
  maxYears: 30,
};

export type EmiErrors = Partial<Record<keyof EmiInput, string>>;

export function validateEmiInput(input: EmiInput): EmiErrors {
  const errors: EmiErrors = {};
  if (!Number.isFinite(input.price) || input.price < EMI_LIMITS.minPrice || input.price > EMI_LIMITS.maxPrice) {
    errors.price = "Enter a property price between ₹5 L and ₹500 Cr.";
  }
  if (!Number.isFinite(input.downPayment) || input.downPayment < 0) {
    errors.downPayment = "Down payment cannot be negative.";
  } else if (Number.isFinite(input.price) && input.downPayment >= input.price) {
    errors.downPayment = "Down payment must be less than the property price.";
  }
  if (
    !Number.isFinite(input.annualRatePercent) ||
    input.annualRatePercent < EMI_LIMITS.minRate ||
    input.annualRatePercent > EMI_LIMITS.maxRate
  ) {
    errors.annualRatePercent = "Enter an interest rate between 0% and 20%.";
  }
  if (
    !Number.isInteger(input.years) ||
    input.years < EMI_LIMITS.minYears ||
    input.years > EMI_LIMITS.maxYears
  ) {
    errors.years = "Choose a term between 1 and 30 years.";
  }
  return errors;
}

/**
 * Standard reducing-balance EMI:
 *   EMI = P · r · (1 + r)^n / ((1 + r)^n − 1), with r the monthly rate and n the months.
 * Returns null when the input is invalid.
 */
export function calculateEmi(input: EmiInput): EmiResult | null {
  if (Object.keys(validateEmiInput(input)).length > 0) return null;
  const principal = input.price - input.downPayment;
  const months = input.years * 12;
  const r = input.annualRatePercent / 12 / 100;
  const monthlyPayment =
    r === 0 ? principal / months : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  const totalPayable = monthlyPayment * months;
  return {
    principal,
    monthlyPayment,
    totalInterest: totalPayable - principal,
    totalPayable,
    months,
  };
}
