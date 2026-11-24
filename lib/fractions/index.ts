export type Operation = "+" | "−" | "×" | "÷";
export type Fraction = { numerator: bigint; denominator: bigint };
export type Operand = { numerator: string; denominator: string | null };
export type Step = { title: string; formula: string; final?: boolean };
export type Calculation = { fraction: Fraction; steps: Step[] };

export class FractionError extends Error {}

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a || 1n;
}

function positiveDenominator(fraction: Fraction): Fraction {
  return fraction.denominator < 0n
    ? { numerator: -fraction.numerator, denominator: -fraction.denominator }
    : fraction;
}

export function simplify(fraction: Fraction): Fraction {
  if (fraction.denominator === 0n) {
    throw new FractionError("Il denominatore deve essere diverso da zero");
  }
  const normalized = positiveDenominator(fraction);
  const divisor = gcd(normalized.numerator, normalized.denominator);
  return {
    numerator: normalized.numerator / divisor,
    denominator: normalized.denominator / divisor,
  };
}

export function parseOperand(operand: Operand): Fraction {
  if (!/^-?\d+$/.test(operand.numerator)) {
    throw new FractionError("Completa il numeratore");
  }
  if (operand.denominator !== null && !/^-?\d+$/.test(operand.denominator)) {
    throw new FractionError("Completa il denominatore");
  }
  if (operand.numerator.replace("-", "").length > 24 ||
      (operand.denominator?.replace("-", "").length ?? 0) > 24) {
    throw new FractionError("Usa al massimo 24 cifre per ogni numero");
  }
  const fraction = {
    numerator: BigInt(operand.numerator),
    denominator: BigInt(operand.denominator ?? "1"),
  };
  if (fraction.denominator === 0n) {
    throw new FractionError("Il denominatore deve essere diverso da zero");
  }
  return positiveDenominator(fraction);
}

export function formatFraction(fraction: Fraction): string {
  const { numerator, denominator } = positiveDenominator(fraction);
  return denominator === 1n ? String(numerator) : `${numerator}/${denominator}`;
}

export function buildSteps(
  left: Fraction,
  right: Fraction,
  operation: Operation,
  raw: Fraction,
  result: Fraction,
): Step[] {
  const steps: Step[] = [];
  if (operation === "+" || operation === "−") {
    const common = left.denominator / gcd(left.denominator, right.denominator) * right.denominator;
    const a = left.numerator * (common / left.denominator);
    const b = right.numerator * (common / right.denominator);
    if (left.denominator !== right.denominator) {
      steps.push({
        title: "Porta le frazioni al denominatore comune.",
        formula: `${a}/${common} ${operation} ${b}/${common}`,
      });
    }
    steps.push({
      title: operation === "+" ? "Somma i numeratori." : "Sottrai i numeratori.",
      formula: `(${a} ${operation} ${b})/${common} = ${formatFraction(raw)}`,
    });
  } else {
    const multiplier = operation === "÷"
      ? positiveDenominator({ numerator: right.denominator, denominator: right.numerator })
      : right;
    if (operation === "÷") {
      steps.push({
        title: "Moltiplica per il reciproco del divisore.",
        formula: `${formatFraction(left)} × ${formatFraction(multiplier)}`,
      });
    }
    steps.push({
      title: "Moltiplica numeratori e denominatori.",
      formula: `(${left.numerator} × ${multiplier.numerator})/(${left.denominator} × ${multiplier.denominator}) = ${formatFraction(raw)}`,
    });
  }
  if (raw.numerator !== result.numerator || raw.denominator !== result.denominator) {
    steps.push({
      title: "Semplifica la frazione.",
      formula: `${formatFraction(raw)} = ${formatFraction(result)}`,
    });
  }
  steps.push({ title: "Ecco il risultato.", formula: formatFraction(result), final: true });
  return steps;
}

export function calculateFractions(left: Fraction, right: Fraction, operation: Operation): Calculation {
  if (left.denominator === 0n || right.denominator === 0n) {
    throw new FractionError("Il denominatore deve essere diverso da zero");
  }
  left = positiveDenominator(left);
  right = positiveDenominator(right);
  let raw: Fraction;
  switch (operation) {
    case "+":
    case "−": {
      const denominator = left.denominator / gcd(left.denominator, right.denominator) * right.denominator;
      const a = left.numerator * (denominator / left.denominator);
      const b = right.numerator * (denominator / right.denominator);
      raw = { numerator: operation === "+" ? a + b : a - b, denominator };
      break;
    }
    case "×":
      raw = { numerator: left.numerator * right.numerator, denominator: left.denominator * right.denominator };
      break;
    case "÷":
      if (right.numerator === 0n) throw new FractionError("Impossibile dividere per zero");
      raw = positiveDenominator({ numerator: left.numerator * right.denominator, denominator: left.denominator * right.numerator });
      break;
    default:
      throw new FractionError("Scegli un'operazione");
  }
  const fraction = simplify(raw);
  return { fraction, steps: buildSteps(left, right, operation, raw, fraction) };
}

export function getGraphModel(fraction: Fraction) {
  const negative = fraction.numerator < 0n;
  const absolute = negative ? -fraction.numerator : fraction.numerator;
  const whole = absolute / fraction.denominator;
  const remainder = absolute % fraction.denominator;
  const remainderText = `${remainder}/${fraction.denominator}`;
  const description = negative
    ? `Risultato negativo, ${formatFraction(fraction)}`
    : whole === 0n
      ? remainder === 0n ? "0 interi" : `${remainderText} di un intero`
      : `${whole} ${whole === 1n ? "intero" : "interi"}${remainder ? ` e ${remainderText}` : ""}`;
  return {
    whole,
    remainder,
    denominator: fraction.denominator,
    negative,
    grouped: whole >= 4n,
    fullDisks: whole >= 4n ? 1 : Number(whole),
    // Only the SVG angle uses floating point; the calculation and legend stay exact.
    ratio: Number(remainder) / Number(fraction.denominator),
    description,
  };
}
